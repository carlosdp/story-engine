import { ReturnAction, SignalActionPayload } from '../action.js';
import { Action, ActionResult } from '../action.js';
import { sql } from '../db.js';
import { embedding } from '../utils.js';
import { LLMSubsystem } from './base.js';
import { getRandomCountry } from './countries.js';

class ChooseGender extends Action {
  description = 'Chooses a random gender';
  parameters = {};

  async execute(_thoughtActionId: string, _parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const randomGender = Math.random() > 0.5 ? 'Male' : 'Female';

    return { status: 'complete', data: randomGender };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return data;
  }
}

class ChooseOrigin extends Action {
  description = 'Chooses a country origin';
  parameters = {};

  async execute(_thoughtActionId: string, _parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const randomCountry = getRandomCountry();

    return { status: 'complete', data: randomCountry };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return data;
  }
}

class CreateCharacter extends ReturnAction {
  description = 'Create the final character';
  parameters = {
    name: { type: 'string', description: "the character's name" },
    short_description: {
      type: 'string',
      description:
        'a 2-3 sentence description of the character, concentrating on their profession and any major affiliations',
    },
    backstory: {
      type: 'string',
      description:
        'a backstory for the character, how did they come into this position? did they go to school somewhere? what are they proud of? do they have a family? what are their hobbies and interests?',
    },
    personality: { type: 'string', description: 'are they abrasive? comical? serious? shy? etc.' },
    writing_style: {
      type: 'string',
      description: 'complete sentences? very casual? shortened sentences? mis-spellings? uses slang? etc.',
    },
  };

  async payload(worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    const embed = await embedding(`${parameters.short_description} ${parameters.backstory}`);

    const characters = await sql`
      insert into characters (world_id, name, description, backstory, personality, writing_style, embedding)
      values (${worldId}, ${parameters.name}, ${parameters.short_description}, ${parameters.backstory}, ${
      parameters.personality
    }, ${parameters.writing_style}, ${JSON.stringify(embed)}) returning id
    `;
    const character = characters[0];

    if (!character) {
      throw new Error('Character not created');
    }

    return { name: parameters.name, id: character.id };
  }
}

export class CharacterBuilder extends LLMSubsystem {
  description = 'Responsible for creating new characters';
  actions = [ChooseGender, ChooseOrigin, CreateCharacter];
  agentPurpose =
    'You are superintelligent character designer for a perisistent video-game world. Your job is to create the requested character that fits into the world, and the story.';
  model = 'gpt-4-0613' as const;

  override async instructions(): Promise<string[]> {
    const worlds =
      await sql`select worlds.* from worlds left join thought_processes on worlds.id = thought_processes.world_id where thought_processes.id = ${this.thoughtProcess.id}`;
    const world = worlds[0];

    return [
      'Start by generating a gender and origin for the character',
      'Once you have the necessary information, create the character',
      "Characters should have first and last names, unless it's an explicit choice to have a single word name",
      `Consider this World Description: ${world.description}`,
    ];
  }
}
