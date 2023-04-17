import { sql } from './db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionResult = { status: 'failed' } | { status: 'waiting' | 'complete'; data: any };

export abstract class Action {
  abstract name: string;
  abstract description: string;
  abstract parameters: Record<string, { type: string; description: string }>;

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

  serializeDefinition() {
    return `${this.name}: ${this.description}. Parameters: ${JSON.stringify(this.parameters)}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async sendSignal(thoughtActionId: string, subsystem: string, payload: any) {
    const messageRes = await sql`insert into messages ${sql({
      type: 'command',
      direction: 'out',
      from_action_id: thoughtActionId,
      subsystem,
      payload,
    })} returning id`;
    return messageRes[0].id;
  }

  protected async getSignalResponse(messageId: string) {
    const messageRes =
      await sql`select * from messages where direction = 'in' and response_to = ${messageId} and acknowledged_at is null`;
    const message = messageRes[0];

    if (!message) {
      return null;
    }

    await sql`update messages set acknowledged_at = now() where id = ${message.id}`;

    return message.payload;
  }
}
