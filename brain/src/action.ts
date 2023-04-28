import { validate } from 'jsonschema';

import { sql } from './db';
import { embedding } from './utils';

export type Observation = {
  subsystem: string;
  text: string;
  location?: number[] | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionResult = { status: 'failed' } | { status: 'waiting' | 'complete'; data: any };

export abstract class Action {
  abstract name: string;
  abstract description: string;
  abstract parameters: Record<string, any>;

  static STATUS_COMPLETE = 'complete' as const;
  static STATUS_FAILED = 'failed' as const;
  static STATUS_WAITING = 'waiting' as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async queue(thoughtProcessId: string, parameters: any) {
    await sql`insert into thought_process_actions ${sql({
      thought_process_id: thoughtProcessId,
      action: this.name,
      parameters,
    })}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract execute(thoughtActionId: string, parameters: Record<string, unknown>, data: any): Promise<ActionResult>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract result(thoughtActionId: string, parameters: Record<string, unknown>, data: any): Promise<string>;

  validate(parameters: Record<string, unknown>) {
    const schema = {
      type: 'object',
      properties: this.parameters,
    };

    return validate(parameters, schema, { required: true });
  }

  async isAvailable(): Promise<boolean> {
    const required = await this.requiredResearch();
    if (required.length === 0) {
      return true;
    }

    const uncompletedResearch =
      await sql`select * from available_researchables where active = true and id not in (${sql(required)})`;

    return uncompletedResearch.length === 0;
  }

  async requiredResearch(): Promise<string[]> {
    return [];
  }

  serializeDefinition() {
    return `${this.name}: ${this.description}. Parameters: ${JSON.stringify(this.parameters)}`;
  }

  protected async sendSignal(
    thoughtActionId: string,
    direction: 'in' | 'out',
    subsystem: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    from_subsystem: string | null = null
  ) {
    const messageRes = await sql`insert into messages ${sql({
      type: 'command',
      direction,
      from_subsystem,
      from_action_id: thoughtActionId,
      subsystem,
      payload,
    })} returning id`;
    return messageRes[0].id;
  }

  protected async getSignalResponse(messageId: string) {
    const signalRes = await sql`select * from messages where id = ${messageId}`;
    const signal = signalRes[0];

    if (!signal) {
      return null;
    }

    if (signal.response_to && signal.direction === 'in') {
      // check if target thought process is terminated
      const responseToSignalRes = await sql`select * from messages where id = ${signal.response_to}`;
      const responseToSignal = responseToSignalRes[0];

      if (!responseToSignal) {
        return null;
      }

      const targetThoughtProcessRes =
        await sql`select * from thought_processes left join thought_process_actions on thought_process_actions.thought_process_id = thought_processes.id where thought_process_actions.id = ${responseToSignal.from_action_id}`;
      const targetThoughtProcess = targetThoughtProcessRes[0];

      if (!targetThoughtProcess) {
        return null;
      }

      if (targetThoughtProcess.terminated_at) {
        return false;
      }
    }

    const messageRes =
      await sql`select * from messages where direction = 'in' and response_to = ${messageId} and acknowledged_at is null`;
    const message = messageRes[0];

    if (!message) {
      return null;
    }

    await sql`update messages set acknowledged_at = now() where id = ${message.id}`;

    return message.payload;
  }

  protected async saveObservation(observation: Observation) {
    const embed = await embedding(observation.text);

    const rows = await sql`
      insert into observations ${sql({
        ...observation,
        embedding: JSON.stringify(embed),
        location:
          observation.location && observation.location.length > 1
            ? [observation.location[0], observation.location[observation.location.length - 1]]
            : null,
      })} returning id
    `;

    return rows[0].id;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SignalActionPayload = any;

export abstract class SignalAction extends Action {
  from_subsystem: string | null = null;
  abstract subsystem: string;
  abstract direction: 'in' | 'out';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract payload(parameters: Record<string, unknown>): Promise<SignalActionPayload>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract responseToResult(parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(thoughtActionId: string, parameters: Record<string, unknown>, data: any): Promise<ActionResult> {
    if (!data?.messageId) {
      const messageId = await this.sendSignal(
        thoughtActionId,
        this.direction,
        this.subsystem,
        await this.payload(parameters),
        this.from_subsystem
      );
      return { status: Action.STATUS_WAITING, data: { messageId } };
    } else {
      const response = await this.getSignalResponse(data.messageId);
      if (response === null) {
        return { status: Action.STATUS_WAITING, data };
      } else if (response === false) {
        return { status: Action.STATUS_FAILED };
      }

      return { status: Action.STATUS_COMPLETE, data: { ...data, responsePayload: response } };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async result(_thoughtActionId: string, parameters: Record<string, unknown>, data: any): Promise<string> {
    return this.responseToResult(parameters, data.responsePayload);
  }
}
