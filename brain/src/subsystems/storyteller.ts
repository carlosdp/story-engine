import { Action, ActionResult } from '../action';
import { sql } from '../db';
import { embedding } from '../utils';
import { LLMSubsystem } from './base';

const BASE_PROMPT = `You are a superintelligent story designer for a perisistent video-game world. Your job is to design narratives that follow and extend parent narratives, and write a story that will be turned into a mission.

- Dependencies such as characters must be created (or found via search) before they can be used in the story
- Always search to for an existing character that meets the story's needs before attempting to creating a new one
- All characters included in the story must be explicitly created or identified before the story can be written
- If you want to use a character you found in a search, you must add it to the story before using it
- Once you have the dependencies you need, write the story

You have access to a variety of actions to query and inspect the game state and world, as well as actions to create dependencies such as characters and write the final story:
{actions}

Based on the input, think about the next action to take. For example:

{ "thought": "I need to do X", "action": "action name here", "parameters": {} }

You can only perform the actions you have have been given. You must only respond in this thought/action format.

Set "action" to null if the thought chain is complete (no further action needed)`;

const CHARACTER_NAMES = ['Aldus Wright', 'Martha Belkas', 'Lu Sin', 'Karl Kowalski'];

class CreateCharacter extends Action {
  name = 'create-character';
  description = 'Create a character for use in the storyline, returns the name of the character';
  parameters = {
    description: { type: 'string', description: 'a description of the character' },
  };

  async execute(_thoughtActionId: string, _parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const name = CHARACTER_NAMES[Math.floor(Math.random() * CHARACTER_NAMES.length)];

    return { status: 'complete', data: name };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return `Created ${data}`;
  }
}

class SearchForCharacter extends Action {
  name = 'search-character';
  description = 'Search for an existing character to use as part of the storyline';
  parameters = {
    query: {
      type: 'string',
      description: 'a search query for the required attributes of the character, be thorough for good results',
    },
  };

  async execute(_thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const queryEmbedding = await embedding(parameters.query as string);

    const characters = await sql`select id, name, description, 1 - (embedding <=> ${JSON.stringify(
      queryEmbedding
    )}) as similarity from characters where 1 - (embedding <=> ${JSON.stringify(
      queryEmbedding
    )}) > 0.7 order by similarity desc limit 5`;

    return {
      status: 'complete',
      data: characters.map(c => ({ id: c.id, name: c.name, description: c.description })),
    };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return JSON.stringify(data);
  }
}

class AddCharacterToStory extends Action {
  name = 'add-character';
  description = 'Add a character to the story';
  parameters = {
    id: { type: 'string', description: 'the character id' },
  };

  async execute(_thoughtActionId: string, _parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    return { status: 'complete', data: 'Character added' };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return data;
  }
}

class WriteStory extends Action {
  name = 'write-story';
  description = 'Write the story for this storyline';
  parameters = {
    text: { type: 'string', description: 'the text of the story, can span multiple paragraphs' },
  };

  async execute(_thoughtActionId: string, _parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    return { status: 'complete', data: 'Story written succesfully' };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return data;
  }
}

export class Storyteller extends LLMSubsystem {
  name = 'storyteller';
  description = 'Responsible for managing storylines';
  actions = [new CreateCharacter(), new SearchForCharacter(), new AddCharacterToStory(), new WriteStory()];
  basePrompt = BASE_PROMPT;
  model = 'gpt-4' as const;
}
