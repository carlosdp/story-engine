import { sql } from './db.js';

export abstract class ActionGate {
  abstract name: string;
  abstract description: string;

  abstract check(worldId: string, thoughtProcessActionId: string): Promise<boolean>;
}

export class ResearchGate extends ActionGate {
  name = 'research';
  description = 'Checks research requirements are met';

  requiredResearch: string[];

  constructor(requiredResearch: string[]) {
    super();
    this.requiredResearch = requiredResearch;
  }

  async check(worldId: string, _thoughtProcessActionId: string): Promise<boolean> {
    const required = this.requiredResearch;
    if (required.length === 0) {
      return true;
    }

    const completedResearch =
      await sql`select * from completed_researchables where world_id = ${worldId} and name in (${sql(required)})`;

    return completedResearch.length === required.length;
  }
}

export class CooldownGate extends ActionGate {
  name = 'cooldown';
  description = 'Checks cooldown requirements are met';

  cooldown: number;

  constructor(cooldown: number) {
    super();
    this.cooldown = cooldown;
  }

  async check(worldId: string, _thoughtProcessActionId: string): Promise<boolean> {
    if (this.cooldown === 0) {
      return false;
    }

    const lastActionRes =
      await sql`select thought_process_actions.created_at from thought_process_actions left join thought_processes on thought_process_actions.thought_process_id = thought_processes.id where world_id = ${worldId} and action = ${this.name} order by thought_process_actions.created_at desc limit 1`;
    const lastAction = lastActionRes[0];

    if (!lastAction) {
      return true;
    }

    const lastActionDate = new Date(lastAction.created_at);
    const now = new Date();

    return now.getTime() - lastActionDate.getTime() < this.cooldown * 1000;
  }
}

export class StoryAvailableGate extends ActionGate {
  name = 'story-available';
  description = 'Checks there is a story written attached to the thought process';

  constructor() {
    super();
  }

  async check(_worldId: string, thoughtProcessActionId: string): Promise<boolean> {
    const thoughtProcessRes =
      await sql`select tp.* from thought_processes tp left join thought_process_actions tpa on tpa.thought_process_id = tp.id where tpa.id = ${thoughtProcessActionId} limit 1`;
    const thoughtProcess = thoughtProcessRes[0];

    if (!thoughtProcess || !thoughtProcess.data?.storylineId) {
      return false;
    }

    const storyRes =
      await sql`select count(id) from storyline_stories where storyline_id = ${thoughtProcess.data.storylineId}`;

    return storyRes[0].count > 0;
  }
}
