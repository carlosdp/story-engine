import { SignalAction, SignalActionPayload } from '../action.js';
import { sql } from '../db.js';
import { embedding } from '../utils.js';
import { LLMSubsystem } from './base.js';
import { EntityBuilder } from './entityBuilder.js';

class CreateCharacter extends SignalAction {
  description = 'Create a character using a description, returns the name of the character';
  parameters = {
    description: { type: 'string', description: 'a description of the individual character that is needed' },
    story: { type: 'string', description: 'relevant parts of the story text to use as context' },
  };
  subsystem = EntityBuilder;

  async payload(_worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    return {
      command: `Create a character based on this description: ${parameters.description}`,
      story_reference: parameters.story,
    };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Created character: ${JSON.stringify(response)}`;
  }
}

export class CharactorCreator extends LLMSubsystem {
  description = 'Assistant responsible for helping the user create a character';
  actions = [CreateCharacter];
  agentPurpose =
    'You are superintelligent character designer assistnat for a perisistent video-game world. Your job is to help the user create a character that fits into the world, and the story.';
  model = 'gpt-4-0613' as const;

  override async instructions(): Promise<string[]> {
    // if character exists, load character data
    // simple changes are queued for agent, but not brought up until either a) a complex change is made or b) the character is finialized

    let character: any = null;
    let characterChangeHistory = 'None';

    if (this.thoughtProcess.data.character_id) {
      const characterRes = await sql`select * from entities where id = ${this.thoughtProcess.data.character_id}`;
      character = characterRes[0];

      if (character) {
        // need concept for "character change history", so we don't need to re-use thought processes
        characterChangeHistory = character.change_history;
      }
    }

    // load relevant rules as reference
    const rulesQuestion = await embedding('What are the rules for creating a character?');

    const rules = await sql`select *, embedding <=> ${JSON.stringify(
      rulesQuestion
    )} as "distance" from rules where world_id = ${
      this.thoughtProcess.world_id
    } and distance < 0.3 sort by distance ascending limit 10`;
    const rulesText = rules.map(r => r.plain).join('\n');

    // load relevant stories
    const stories = await sql`select * from stories where world_id = ${this.thoughtProcess.world_id} limit 10`;
    const storiesText = stories.map(s => s.text).join('\n');

    const worlds =
      await sql`select worlds.* from worlds left join thought_processes on worlds.id = thought_processes.world_id where thought_processes.id = ${this.thoughtProcess.id}`;
    const world = worlds[0];

    return [
      !character && 'Create a character that fits into the given world and story, with the given parameters',
      `Consider this World Description: ${world.description}`,
      `Consider these Stories: ${storiesText}`,
      `Follow these rules:\n${rulesText}\n\n`,
      character && 'Make the modifications to the character that are requested',
      character && `Previous Character Changes:\n${characterChangeHistory}`,
      character && `Current Character:\n${JSON.stringify(character)}`,
    ];
  }
}
