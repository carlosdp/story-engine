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
  abstract execute(thoughtProcessId: string, parameters: Record<string, unknown>, data: any): Promise<ActionResult>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract result(thoughtProcessId: string, parameters: Record<string, unknown>, data: any): Promise<string>;

  serializeDefinition() {
    return `${this.name}: ${this.description}. Parameters: ${JSON.stringify(this.parameters)}`;
  }
}
