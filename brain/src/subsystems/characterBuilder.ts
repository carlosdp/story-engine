import { ReturnAction, SignalActionPayload } from '../action';
import { Action, ActionResult } from '../action';
import { sql } from '../db';
import { embedding } from '../utils';
import { LLMSubsystem } from './base';
import { getRandomCountry } from './countries';

const BASE_PROMPT = `You are superintelligent character designer for a perisistent video-game world. Your job is to create the requested character that fits into the world, and the story.

- Start by generating a gender and origin for the character
- Once you have the necessary information, create the character
- Characters should have first and last names, unless it's an explicit choice to have a single word name

World Description: A small town in Europe called Castor Town, that looks quaint and traditional, but is actually a hotspot for people working on the beginnings of a new space race.

You have access to several actions to gather information about other characters, relationships, organizations, and stories, as well as actions to finally create the character:
{actions}

Based on the input, think about the next action to take. For example:

{ "thought": "I need to do X", "action": "action name here", "parameters": {} }

You can only perform the actions you have have been given. You must only respond in this thought/action format.

Set "action" to null if the thought chain is complete (no further action needed)`;

class ChooseGender extends Action {
  name = 'choose-gender';
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
  name = 'choose-origin';
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
  name = 'create-character';
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
  name = 'characterBuilder';
  description = 'Responsible for creating new characters';
  actions = [new ChooseGender(), new ChooseOrigin(), new CreateCharacter()];
  basePrompt = BASE_PROMPT;
  model = 'gpt-4' as const;
}
