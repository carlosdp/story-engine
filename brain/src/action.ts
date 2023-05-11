import { validate } from 'jsonschema';

import { sql } from './db';
import { ActionGate } from './gate';
import { embedding } from './utils';

export type Observation = {
  subsystem: string;
  text: string;
  location?: number[] | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionResult = { status: 'failed' } | { status: 'waiting' | 'complete'; data: any };

export type RustResources = { wood?: number; stone?: number; metal?: number; sulfur?: number; hqm?: number };

export abstract class Action {
  abstract name: string;
  abstract description: string;
  abstract parameters: Record<string, any>;

  static STATUS_COMPLETE = 'complete' as const;
  static STATUS_FAILED = 'failed' as const;
  static STATUS_WAITING = 'waiting' as const;

  gates: ActionGate[] = [];

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

    const checks = await Promise.all(this.gates.map(gate => gate.check(thoughtProcess.world_id, thoughtProcessId)));

    return !checks.some(x => !x);
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

    const messageRes = await sql`insert into signals ${sql({
      world_id: thoughtProcess.world_id,
      direction,
      from_subsystem,
      from_action_id: thoughtActionId,
      subsystem,
      payload: payload,
    })} returning id`;
    return messageRes[0].id;
  }

  protected async getSignalResponse(messageId: string) {
    const signalRes = await sql`select * from signals where id = ${messageId}`;
    const signal = signalRes[0];

    if (!signal) {
      return null;
    }

    if (signal.response_to && signal.direction === 'in') {
      // check if target thought process is terminated
      const responseToSignalRes = await sql`select * from signals where id = ${signal.response_to}`;
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
      await sql`select * from signals where direction = 'in' and response_to = ${messageId} and acknowledged_at is null`;
    const message = messageRes[0];

    if (!message) {
      return null;
    }

    await sql`update signals set acknowledged_at = now() where id = ${message.id}`;

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

  protected async consumeResources(
    thoughtActionId: string,
    data: any,
    resources: RustResources
  ): Promise<ActionResult> {
    if (!data.resourceConsumptionMessageId) {
      const messageId = await this.sendSignal(
        thoughtActionId,
        'out',
        'logistics',
        { action: 'consume-resources', resources },
        'logistics'
      );

      return { status: Action.STATUS_WAITING, data: { resourceConsumptionMessageId: messageId } };
    }

    const response = await this.getSignalResponse(data.resourceConsumptionMessageId);

    if (!response) {
      return { status: Action.STATUS_WAITING, data };
    }

    const { success } = response;

    return success ? { status: Action.STATUS_COMPLETE, data } : { status: Action.STATUS_FAILED };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SignalActionPayload = any;

export abstract class SignalAction extends Action {
  from_subsystem: string | null = null;
  abstract subsystem: string;
  abstract direction: 'in' | 'out';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract payload(worldId: string, parameters: Record<string, unknown>): Promise<SignalActionPayload>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract responseToResult(parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(thoughtActionId: string, parameters: Record<string, unknown>, data: any): Promise<ActionResult> {
    const thoughtProcessRes =
      await sql`select world_id from thought_processes left join thought_process_actions on thought_process_actions.thought_process_id = thought_processes.id where thought_process_actions.id = ${thoughtActionId}`;
    const thoughtProcess = thoughtProcessRes[0];

    if (!thoughtProcess) {
      throw new Error(`Thought process not found for action ${thoughtActionId}`);
    }

    if (!data?.messageId) {
      const payload = await this.payload(thoughtProcess.world_id, parameters);
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

export abstract class ReturnAction extends SignalAction {
  subsystem = '';
  direction = 'in' as const;

  async responseToResult(_parameters: Record<string, unknown>, _response: any): Promise<string> {
    throw new Error('responseToResult should never be called for a ReturnAction');
  }

  async execute(thoughtActionId: string, parameters: Record<string, unknown>, data: any): Promise<ActionResult> {
    const thoughtProcessRes =
      await sql`select thought_processes.id, initiating_message_id, subsystem from thought_processes inner join thought_process_actions on thought_process_actions.thought_process_id = thought_processes.id where thought_process_actions.id = ${thoughtActionId} limit 1`;
    const thoughtProcess = thoughtProcessRes[0];

    if (!thoughtProcess) {
      throw new Error(`Thought process not found for action ${thoughtActionId}`);
    }

    const initiatingMessageRes =
      await sql`select from_subsystem from signals where id = ${thoughtProcess.initiating_message_id} limit 1`;
    const initiatingMessage = initiatingMessageRes[0];

    if (!initiatingMessage) {
      throw new Error(`Initiating message not found for action ${thoughtActionId}`);
    }

    this.from_subsystem = thoughtProcess.subsystem;
    this.subsystem = initiatingMessage.from_subsystem;

    const result = super.execute(thoughtActionId, parameters, data);

    await sql`update thought_processes set terminated_at = now() where id = ${thoughtProcess.id}`;

    return result;
  }
}
