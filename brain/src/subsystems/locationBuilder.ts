import { ReturnAction, SignalActionPayload } from '../action';
import { Action, ActionResult } from '../action';
import { sql } from '../db';
import { embedding } from '../utils';
import { LLMSubsystem } from './base';

const BASE_PROMPT = `You are superintelligent world designer for a perisistent video-game world. Your job is to create the requested location(s) that fits into the world, and the story.

- Start by reflecting on what kind of location you need to create. A town? city? planet? country?
- Once you have the necessary information, create the location

World Description: {world_description}

You have access to several actions to gather information needed, as well as actions to finally create the location:
{actions}

Based on the input, think about the next action to take. For example:

{ "thought": "I need to do X", "action": "action name here", "parameters": {} }

You can only perform the actions you have have been given. You must only respond in this thought/action format.

Set "action" to null if the thought chain is complete (no further action needed)`;

class SelfReflection extends Action {
  name = 'self-reflection';
  description = 'Reflect on a thought or idea to inform later action decisions';
  parameters = {
    idea: { type: 'string', description: 'the idea or thought' },
  };

  async execute(_thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    return { status: 'complete', data: parameters.idea };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return data;
  }
}

class CreateLocation extends ReturnAction {
  name = 'create-location';
  description = 'Create the final location';
  parameters = {
    name: { type: 'string', description: 'the location name' },
    short_description: {
      type: 'string',
      description: 'a 2-3 sentence description of the location',
    },
    backstory: {
      type: 'string',
      description:
        'a backstory for the location, how did it come to be? what is its importance to the world and the story?',
    },
  };

  async payload(worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    const embed = await embedding(`${parameters.short_description} ${parameters.backstory}`);

    const locations = await sql`
      insert into locations (world_id, name, description, backstory, embedding)
      values (${worldId}, ${parameters.name}, ${parameters.short_description}, ${
      parameters.backstory
    }, ${JSON.stringify(embed)}) returning id
    `;
    const location = locations[0];

    if (!location) {
      throw new Error('Location not created');
    }

    return { name: parameters.name, id: location.id };
  }
}

export class LocationBuilder extends LLMSubsystem {
  description = 'Responsible for creating new world locations';
  actions = [new SelfReflection(), new CreateLocation()];
  basePrompt = BASE_PROMPT;
  model = 'gpt-4' as const;

  override async assemblePrompt(thoughtProcessId: string): Promise<string> {
    const worlds =
      await sql`select worlds.* from worlds left join thought_processes on worlds.id = thought_processes.world_id where thought_processes.id = ${thoughtProcessId}`;
    const world = worlds[0];

    return this.basePrompt.replace('{world_description}', world.description);
  }
}
