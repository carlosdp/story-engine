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

  cooldown = 0;

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

  async isAvailable(thoughtProcessId: string): Promise<boolean> {
    const thoughtProcessRes = await sql`select world_id from thought_processes where id = ${thoughtProcessId}`;
    const thoughtProcess = thoughtProcessRes[0];

    if (!thoughtProcess) {
      throw new Error(`Thought process ${thoughtProcessId} not found`);
    }

    const checks = await Promise.all([
      this.hasRequiredResearch(thoughtProcess.world_id),
      this.isInCooldown(thoughtProcess.world_id),
    ]);

    return !checks.some(x => !x);
  }

  async hasRequiredResearch(worldId: string): Promise<boolean> {
    const required = await this.requiredResearch();
    if (required.length === 0) {
      return true;
    }

    const uncompletedResearch =
      await sql`select * from available_researchables where world_id = ${worldId} and active = true and id not in (${sql(
        required
      )})`;

    return uncompletedResearch.length === 0;
  }

  async requiredResearch(): Promise<string[]> {
    return [];
  }

  async isInCooldown(worldId: string) {
    if (this.cooldown === 0) {
      return false;
    }

    const lastActionRes =
      await sql`select created_at from thought_process_actions left join thought_processes on thought_process_actions.thought_process_id = thought_processes.id where world_id = ${worldId} and action = ${this.name} order by created_at desc limit 1`;
    const lastAction = lastActionRes[0];

    if (!lastAction) {
      return false;
    }

    const lastActionDate = new Date(lastAction.created_at);
    const now = new Date();

    return now.getTime() - lastActionDate.getTime() < this.cooldown * 1000;
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
    const thoughtProcessRes =
      await sql`select world_id from thought_processes left join thought_process_actions on thought_process_actions.thought_process_id = thought_processes.id where thought_process_actions.id = ${thoughtActionId}`;
    const thoughtProcess = thoughtProcessRes[0];

    if (!thoughtProcess) {
      throw new Error(`Thought process not found for action ${thoughtActionId}`);
    }

    const messageRes = await sql`insert into messages ${sql({
      world_id: thoughtProcess.world_id,
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

  protected async saveObservation(thoughtActionId: string, observation: Observation) {
    const thoughtProcessRes =
      await sql`select world_id from thought_processes left join thought_process_actions on thought_process_actions.thought_process_id = thought_processes.id where thought_process_actions.id = ${thoughtActionId}`;
    const thoughtProcess = thoughtProcessRes[0];

    if (!thoughtProcess) {
      throw new Error(`Thought process not found for action ${thoughtActionId}`);
    }

    const embed = await embedding(observation.text);

    const rows = await sql`
      insert into observations ${sql({
        world_id: thoughtProcess.world_id,
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
      const payload = await this.payload(parameters);
      const messageId = await this.sendSignal(
        thoughtActionId,
        this.direction,
        this.subsystem,
        payload,
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
