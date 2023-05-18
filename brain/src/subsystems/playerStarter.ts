import { Action, ActionResult, SignalAction, SignalActionPayload } from '../action';
import { sql } from '../db';
import { LLMSubsystem } from './base';

const BASE_PROMPT = `You are a subsystem responsible for creating a character for a player, and a starter mission.

- Start by creating a character for them, then attach it to the player, and then create their starter mission
- Characters should be something like an assistant or apprentice
- Starter missions should be a simple task, such as buying something from a store for a boss or colleague

You have access to a variety of actions to complete your objective:
{actions}

Based on the input, think about the next action to take. For example:

{ "thought": "I need to do X", "action": "action name here", "parameters": {} }

You can only perform the actions you have have been given. You must only respond in this thought/action format.

Set "action" to null if the thought chain is complete (no further action needed)`;

class CreateCharacter extends SignalAction {
  name = 'create-character';
  description = 'Create a character';
  parameters = {
    description: { type: 'string', description: 'a description of the character' },
  };
  from_subsystem = 'playerStarter';
  subsystem = 'characterBuilder';
  direction = 'in' as const;

  async payload(_worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    return { command: `Create a character based on this description: ${parameters.description}` };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Created character: ${JSON.stringify(response)}`;
  }
}

class AttachCharacterToPlayer extends Action {
  name = 'attach-character';
  description = 'Attach a character to a player';
  parameters = {
    characterId: { type: 'string', description: 'the character id' },
    playerId: { type: 'string', description: 'the player id' },
  };

  async execute(_thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    await sql`update players set character_id = ${parameters.characterId as string} where id = ${
      parameters.playerId as string
    }`;

    return { status: 'complete', data: 'Character attached' };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return data;
  }
}

class CreateMission extends SignalAction {
  name = 'create-mission';
  description = 'Create a mission for a character';
  parameters = {
    characterId: { type: 'string', description: 'the character id' },
    description: { type: 'string', description: 'a description of the mission' },
  };
  from_subsystem = 'playerStarter';
  subsystem = 'storyteller';
  direction = 'in' as const;

  async payload(_worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    const characters = await sql`select id, name, description from characters where id = ${parameters.characterId}`;
    const character = characters[0];

    if (!character) {
      throw new Error(`Could not find character with id ${parameters.characterId}`);
    }

    return {
      prompt: `Write a story mission for ${character.name}: ${parameters.description}`,
      attachedCharacters: [character],
    };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Created mission: ${JSON.stringify(response)}`;
  }
}

export class PlayerStarter extends LLMSubsystem {
  description = 'Responsible for creating a player character and starter mission';
  actions = [new CreateCharacter(), new AttachCharacterToPlayer(), new CreateMission()];
  basePrompt = BASE_PROMPT;
  model = 'gpt-4' as const;
  temperature = 0;
}
