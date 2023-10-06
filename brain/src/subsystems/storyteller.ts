import { Action, ActionResult, SignalAction, SignalActionPayload } from '../action';
import { sql } from '../db';
import logger from '../logging';
import { SubsystemMessage } from '../signal';
import { embedding } from '../utils';
import { LLMSubsystem } from './base';
import { CharacterBuilder } from './characterBuilder';
import { MissionBuilder } from './missionBuilder';

const BASE_PROMPT = `You are a superintelligent story designer for a perisistent video-game world. Your job is to design narratives that follow and extend parent narratives, and write a story that will be turned into a mission.

- Dependencies such as characters must be created (or found via search) before they can be used in the story
- It's important to always search to for an existing character that meets the story's needs before attempting to creating a new one
- All characters included in the story must be explicitly created or identified before the story can be written
- If you want to use a character you must add it to the story before using it
- If you use an existing character from search, make sure the character actually matches your need. An apprentice marksman is not a skilled marksman, for example.
- It's important that every character mentioned in the prompt is allocated to the story
- You cannot re-use an already allocated character
- Once you have the dependencies you need, write the story
- If a mission story is requested for a player character, create a mission after the story is written

You have access to a variety of actions to query and inspect the game state and world, as well as actions to create dependencies such as characters and write the final story:
{actions}

Based on the input, think about the next action to take. For example:

{ "thought": "I need to do X", "action": "action name here", "parameters": {} }

You can only perform the actions you have have been given. You must only respond in this thought/action format.

Set "action" to null if the thought chain is complete (no further action needed)`;

class CreateCharacter extends SignalAction {
  name = 'create-character';
  description = 'Create a character for use in the storyline, returns the name of the character';
  parameters = {
    description: { type: 'string', description: 'a description of the character' },
  };
  from_subsystem = Storyteller;
  subsystem = CharacterBuilder;
  direction = 'in' as const;

  async payload(_worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    return { command: `Create a character based on this description: ${parameters.description}` };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Created character: ${JSON.stringify(response)}`;
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
    return `Search Results: ${JSON.stringify(data)}`;
  }
}

class AddCharacterToStory extends Action {
  name = 'add-character';
  description = 'Add a character to the story';
  parameters = {
    id: { type: 'string', description: 'the character id' },
  };

  async execute(thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const thoughtProcessRes =
      await sql`select thought_process_id from thought_process_actions where id = ${thoughtActionId}`;
    const thoughtProcessId = thoughtProcessRes[0].thought_process_id;
    const storylines = await sql`select id from storylines where storyteller_id = ${thoughtProcessId}`;
    if (storylines.length === 0) {
      logger.error(`No storyline found for thought process ${thoughtProcessId}`);
      return { status: 'failed' };
    }

    const storylineId = storylines[0].id;

    try {
      await sql`insert into storyline_characters ${sql({
        storyline_id: storylineId,
        character_id: parameters.id as string,
      })}`;
    } catch {
      return { status: 'complete', data: 'Character already added' };
    }

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

  async execute(thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const thoughtProcessRes =
      await sql`select thought_process_id from thought_process_actions where id = ${thoughtActionId}`;
    const thoughtProcessId = thoughtProcessRes[0].thought_process_id;
    const storylines = await sql`select id from storylines where storyteller_id = ${thoughtProcessId}`;
    if (storylines.length === 0) {
      logger.error(`No storyline found for thought process ${thoughtProcessId}`);
      return { status: 'failed' };
    }

    const storylineId = storylines[0].id;

    await sql`insert into storyline_stories ${sql({
      storyline_id: storylineId,
      text: parameters.text as string,
    })}`;

    return { status: 'complete', data: { storylineId } };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return `Story written to storyline ID ${data.storylineId}`;
  }
}

class CreateMission extends SignalAction {
  name = 'create-mission';
  description = 'Create a mission for a player character';
  parameters = {
    characterId: { type: 'string', description: 'the character id' },
    storylineId: { type: 'string', description: 'the storyline id' },
  };
  direction = 'in' as const;
  from_subsystem = Storyteller;
  subsystem = MissionBuilder;

  async payload(_worldId: string, parameters: Record<string, unknown>): Promise<any> {
    const characters =
      await sql`select characters.id, characters.name from characters join storyline_characters on characters.id = storyline_characters.character_id where storyline_characters.storyline_id = ${
        parameters.storylineId as string
      }`;
    const stories = await sql`select * from storyline_stories where storyline_id = ${
      parameters.storylineId as string
    } order by created_at desc limit 1`;
    const story = stories[0].text;

    return {
      instructions: `Create a mission for character ${parameters.characterId} based on this story`,
      storylineId: parameters.storylineId,
      characters,
      story,
    };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Created mission: ${JSON.stringify(response)}`;
  }
}

export class Storyteller extends LLMSubsystem {
  description = 'Responsible for managing storylines';
  actions = [
    new CreateCharacter(),
    new SearchForCharacter(),
    new AddCharacterToStory(),
    new WriteStory(),
    new CreateMission(),
  ];
  basePrompt = BASE_PROMPT;
  model = 'gpt-4' as const;
  temperature = 0.1;

  override async prepareThoughtProcess(thoughtProcessId: string, message: SubsystemMessage): Promise<void> {
    const storylines = await sql`select id from storylines where storyteller_id = ${thoughtProcessId}`;

    if (storylines.length === 0) {
      logger.error(`No storyline found for thought process ${thoughtProcessId}`);

      const thoughtProcesses = await sql`select * from thought_processes where id = ${thoughtProcessId}`;
      const thoughtProcess = thoughtProcesses[0];

      if (!thoughtProcess) {
        throw new Error(`No thought process found for id ${thoughtProcessId}`);
      }

      const storylinesRes = await sql`insert into storylines ${sql({
        world_id: thoughtProcess.world_id,
        storyteller_id: thoughtProcessId,
        prompt: message.payload.prompt,
        scenario_id: message.payload.scenarioId ?? null,
      })} returning id`;
      const storylineId = storylinesRes[0].id;

      // associate player character with storyline
      if (message.payload.attachedCharacters) {
        for (const character of message.payload.attachedCharacters) {
          await sql`insert into storyline_characters ${sql({
            storyline_id: storylineId,
            character_id: character.id,
          })}`;
        }
      }
    }
  }
}
