import { validate } from 'jsonschema';

import { sql } from './db.js';
import { ActionGate } from './gate.js';
import type { Thinker } from './subsystems/base.js';
import { Database } from './supabaseTypes.js';
import { embedding } from './utils.js';

export type Observation = {
  subsystem: string;
  text: string;
  location?: number[] | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionResult = { status: 'failed' } | { status: 'waiting' | 'complete'; data: any };

export type RustResources = { wood?: number; stone?: number; metal?: number; sulfur?: number; hqm?: number };

export type ActionConstructor = new (thoughtProcess: Action['thoughtProcess']) => Action;

export abstract class Action {
  abstract description: string;
  abstract parameters: Record<string, any>;

  protected thoughtProcess: Database['public']['Tables']['thought_processes']['Row'] & { data: any };

  gates: ActionGate[] = [];

  constructor(thoughtProcess: Database['public']['Tables']['thought_processes']['Row']) {
    this.thoughtProcess = thoughtProcess;
  }

  get name(): string {
    return this.constructor.name;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async queue(parameters: any) {
    await sql`insert into thought_process_actions ${sql({
      thought_process_id: this.thoughtProcess.id,
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
    const checks = await Promise.all(
      this.gates.map(gate => gate.check(this.thoughtProcess.world_id, this.thoughtProcess.id))
    );

    return !checks.some(x => !x);
  }

  serializeDefinition() {
    return `${this.name}: ${this.description}. Parameters JSON Schema: ${JSON.stringify(this.parameters)}`;
  }

  protected async sendSignal(
    thoughtActionId: string,
    subsystem: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    from_subsystem: string | null = null
  ) {
    const messageRes = await sql`insert into signals ${sql({
      world_id: this.thoughtProcess.world_id,
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

    if (signal.response_to) {
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

    const messageRes = await sql`select * from signals where response_to = ${messageId} and acknowledged_at is null`;
    const message = messageRes[0];

    if (!message) {
      return null;
    }

    await sql`update signals set acknowledged_at = now() where id = ${message.id}`;

    return message.payload;
  }

  protected async saveObservation(thoughtActionId: string, observation: Observation) {
    const embed = await embedding(observation.text);

    const rows = await sql`
      insert into observations ${sql({
        world_id: this.thoughtProcess.world_id,
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
        'logistics',
        { action: 'consume-resources', resources },
        'logistics'
      );

      return { status: 'waiting', data: { resourceConsumptionMessageId: messageId } };
    }

    const response = await this.getSignalResponse(data.resourceConsumptionMessageId);

    if (!response) {
      return { status: 'waiting', data };
    }

    const { success } = response;

    return success ? { status: 'complete', data } : { status: 'failed' };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SignalActionPayload = any;

export abstract class SignalAction extends Action {
  from_subsystem: (new () => Thinker) | null = null;
  abstract subsystem: new () => Thinker;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract payload(worldId: string, parameters: Record<string, unknown>): Promise<SignalActionPayload>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract responseToResult(parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(thoughtActionId: string, parameters: Record<string, unknown>, data: any): Promise<ActionResult> {
    if (!data?.messageId) {
      const payload = await this.payload(this.thoughtProcess.world_id, parameters);
      const messageId = await this.sendSignal(thoughtActionId, this.subsystem.name, payload, this.from_subsystem?.name);
      return { status: 'waiting', data: { messageId } };
    } else {
      const response = await this.getSignalResponse(data.messageId);
      if (response === null) {
        return { status: 'waiting', data };
      } else if (response === false) {
        return { status: 'failed' };
      }

      return { status: 'complete', data: { ...data, responsePayload: response } };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async result(_thoughtActionId: string, parameters: Record<string, unknown>, data: any): Promise<string> {
    return this.responseToResult(parameters, data.responsePayload);
  }
}

export abstract class ReturnAction extends SignalAction {
  // @ts-ignore
  subsystem = { name: '' };

  async responseToResult(_parameters: Record<string, unknown>, _response: any): Promise<string> {
    throw new Error('responseToResult should never be called for a ReturnAction');
  }

  async execute(thoughtActionId: string, parameters: Record<string, unknown>, data: any): Promise<ActionResult> {
    const initiatingMessageRes =
      await sql`select from_subsystem from signals where id = ${this.thoughtProcess.initiating_message_id} limit 1`;
    const initiatingMessage = initiatingMessageRes[0];

    if (!initiatingMessage) {
      throw new Error(`Initiating message not found for action ${thoughtActionId}`);
    }

    // @ts-ignore
    this.from_subsystem = { name: this.thoughtProcess.subsystem };
    this.subsystem = { name: initiatingMessage.from_subsystem };

    if (!initiatingMessage.from_subsystem) {
      // there was no initiating subsystem, this was initiated manually
      this.subsystem = { name: 'ManualInitiator' };
    }

    const result = await super.execute(thoughtActionId, parameters, data);

    await sql`update thought_processes set terminated_at = now() where id = ${this.thoughtProcess.id}`;

    if (result.status === 'waiting') {
      result.status = 'complete';
    }

    return result;
  }
}
