import { Action } from '../action';
import { sql } from '../db';
import { SubsystemMessage } from '../signal';
import { Subsystem } from './base';

export class HumanResources implements Subsystem {
  async processSignal(message: SubsystemMessage): Promise<string> {
    if (message.payload.request === 'allocate_characters') {
      const { typeCounts } = message.payload;

      const characters = await sql.begin(async tSql => {
        const results: Record<string, { id: string; name: string }[]> = {};

        for (const [type, count] of Object.entries(typeCounts)) {
          const characterRes =
            await tSql`select * from characters where rust_npc_type = ${type} and allocated = false limit ${
              count as number
            }`;

          results[type] = characterRes.map(character => ({
            id: character.id,
            name: `${character.title ? character.title + ' ' : ''}${character.first_name}${character.last_name}`,
          }));

          const characterIds = characterRes.map(character => character.id);
          await tSql`update characters set allocated = true where id in (${sql(characterIds)})`;
        }

        return results;
      });

      await sql`insert into messages ${sql({
        subsystem: 'humanResources',
        direction: 'out',
        type: 'command',
        payload: {
          request: 'allocate_characters',
          characters,
        },
      })}`;
    }

    return '';
  }

  async continueProcessing(_thoughtProcessId: string, _completedActionId: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  getAction(_name: string): Action {
    throw new Error('Method not implemented.');
  }
}
