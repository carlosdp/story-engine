import { SignalAction, SignalActionPayload } from '../action';
import { sql } from '../db';
import { DeterministicSubsystem } from './base';

class AllocateCharacters extends SignalAction {
  name = 'allocate-characters';
  description = 'Allocate characters to Rust';
  parameters = {};

  from_subsystem = 'humanResources';
  subsystem = 'humanResources';
  direction = 'out' as const;

  async payload(_parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    const characters = await sql`select * from characters order by random()`;

    return {
      action: 'allocate-characters',
      characters: characters.map(ch => ({
        id: ch.id,
        npcType: ch.rust_npc_type,
        name: `${ch.title ? ch.title + ' ' : ''}${ch.first_name} ${ch.last_name}`,
      })),
    };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return JSON.stringify(response);
  }
}

export class HumanResources extends DeterministicSubsystem {
  name = 'humanResources';
  actions = [new AllocateCharacters()];
}
