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
  description = 'Chooses a country origin, useful for character names, location names and biomes, item looks, etc.';
  parameters = {};

  async execute(_thoughtActionId: string, _parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const randomCountry = getRandomCountry();

    return { status: 'complete', data: randomCountry };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return data;
  }
}

class CreateEntity extends ReturnAction {
  description = 'Create the entity';
  parameters = {
    name: { type: 'string', description: "the entity's name" },
    description: {
      type: 'string',
      description: 'a full description of the entity, based on the classification and the inspiration properties',
    },
    classification: { type: 'string', description: 'the classification of the entity' },
  };

  async payload(worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    const embed = await embedding(parameters.description);

    const entities = await sql`
      insert into entities (world_id, name, description, classification, embedding, state)
      values (${worldId}, ${parameters.name}, ${parameters.description}, ${parameters.classification}, ${JSON.stringify(
      embed
    )}, '{}'::jsonb) returning id
    `;
    const entity = entities[0];

    if (!entity) {
      throw new Error('Entity not created');
    }

    return { name: parameters.name, id: entity.id };
  }
}

export class EntityBuilder extends LLMSubsystem {
  description = 'Responsible for creating new entities';
  actions = [ChooseGender, ChooseOrigin, CreateEntity];
  agentPurpose =
    'You are superintelligent entity designer for a perisistent video-game world. Your job is to create the requested entity that fits into the world, and the story.';
  model = 'gpt-4-0613' as const;

  override async instructions(): Promise<string[]> {
    const worlds =
      await sql`select worlds.* from worlds left join thought_processes on worlds.id = thought_processes.world_id where thought_processes.id = ${this.thoughtProcess.id}`;
    const world = worlds[0];

    return [
      'Possible entity classifications are exclusively: character, location, item, organization',
      'If the entity should be a character, start by generating a gender and origin as inspiration for the character properties',
      'If the entity should be a location or item, start by generating an origin as inspiration for the location properties',
      "Characters should have first and last names, unless it's an explicit choice to have a single word name",
      'Once you have the necessary inspiration, create the entity',
      `Consider this World Description: ${world.description}`,
    ];
  }
}
