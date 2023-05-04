import { Action, ActionResult } from '../action';
import { sql } from '../db';
import logger from '../logging';
import { DeterministicSubsystem } from './base';

class AllocateCharacters extends Action {
  name = 'allocate-characters';
  description = 'Allocate characters to Rust';
  parameters = {};

  async execute(thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const typeCounts = parameters.typeCounts as Record<string, number>;
    logger.debug(`Allocating ${JSON.stringify(typeCounts)} characters`);

    const thoughtProcessRes =
      await sql`select * from thought_processes inner join thought_process_actions on thought_processes.id = thought_process_actions.thought_process_id where thought_process_actions.id = ${thoughtActionId} limit 1`;
    const thoughtProcess = thoughtProcessRes[0];

    const characters = await sql`select * from characters where world_id = ${thoughtProcess.world_id}`;

    return { status: 'complete', data: characters };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return JSON.stringify(data);
  }
}

export class HumanResources extends DeterministicSubsystem {
  name = 'humanResources';
  actions = [new AllocateCharacters()];
}
