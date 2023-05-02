import { Action, ActionResult } from '../action';
import { sql } from '../db';
import logger from '../logging';
import { DeterministicSubsystem } from './base';

class AllocateCharacters extends Action {
  name = 'allocate-characters';
  description = 'Allocate characters to Rust';
  parameters = {
    typeCounts: {
      type: 'object',
    },
    required: ['typeCounts'],
  };

  async execute(_thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const typeCounts = parameters.typeCounts as Record<string, number>;
    logger.debug(`Allocating ${JSON.stringify(typeCounts)} characters`);

    const characters = await sql.begin(async tSql => {
      const results: Record<string, { id: string; name: string }[]> = {};
      let characterIds: string[] = [];

      for (const [type, count] of Object.entries(typeCounts)) {
        const characterRes =
          await tSql`select * from characters where rust_npc_type = ${type} and allocated = false and deceased = false limit ${
            count as number
          }`;
        logger.debug(`Chose ${characterRes.length} ${type} characters`);

        results[type] = characterRes.map(character => ({
          id: character.id,
          name: `${character.title ? character.title + ' ' : ''}${character.first_name} ${character.last_name}`,
        }));

        characterIds = [...characterIds, ...characterRes.map(character => character.id)];
      }

      await tSql`update characters set allocated = true where id = any(${characterIds})`;

      return results;
    });

    logger.debug(`Allocated ${JSON.stringify(Object.values(characters).length)} characters, sending to Rust`);

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
