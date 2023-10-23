import { ReturnAction, SignalActionPayload } from '../action.js';
import { Action, ActionResult } from '../action.js';
import { sql } from '../db.js';
import { embedding } from '../utils.js';
import { LLMSubsystem } from './base.js';

class SelfReflection extends Action {
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
  actions = [SelfReflection, CreateLocation];
  agentPurpose =
    'You are superintelligent world designer for a perisistent video-game world. Your job is to create the requested location(s) that fits into the world, and the story.';
  model = 'gpt-4-0613' as const;

  override async instructions(): Promise<string[]> {
    const worlds =
      await sql`select worlds.* from worlds left join thought_processes on worlds.id = thought_processes.world_id where thought_processes.id = ${this.thoughtProcess.world_id}`;
    const world = worlds[0];

    return [
      'Start by reflecting on what kind of location you need to create. A town? city? planet? country?',
      'Once you have the necessary information, create the location',
      `Consider this World Description: ${world.description}`,
    ];
  }
}
