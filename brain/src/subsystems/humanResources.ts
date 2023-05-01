import { Action } from '../action';
import { sql } from '../db';
import logger from '../logging';
import { SubsystemMessage } from '../signal';
import { Subsystem } from './base';

export class HumanResources implements Subsystem {
  async processSignal(message: SubsystemMessage): Promise<string> {
    logger.debug('HumanResources processing signal');
    if (message.payload.request === 'allocate_characters') {
      logger.debug('HumanResources allocating');
      const { typeCounts } = message.payload;
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

        logger.debug('Updating allocation statuses');
        await tSql`update characters set allocated = true where id = any(${characterIds})`;
        logger.debug('Allocation statuses updated');

        return results;
      });

      logger.debug(`Allocated ${JSON.stringify(Object.values(characters).length)} characters, sending to Rust`);

      await sql`insert into messages ${sql({
        world_id: message.world_id,
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
