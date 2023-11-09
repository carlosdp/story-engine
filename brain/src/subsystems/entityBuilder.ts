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
  description = 'Create a new entity';
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

class ModifyEntity extends ReturnAction {
  description = 'Modify the existing entity';
  parameters = {
    name: { type: 'string', description: "the entity's name" },
    description: {
      type: 'string',
      description: 'a full description of the entity, based on the classification and the inspiration properties',
    },
    classification: { type: 'string', description: 'the classification of the entity' },
  };

  async payload(worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    const entityId = this.thoughtProcess.data.entity_id;

    if (!entityId) {
      throw new Error('No entity id');
    }

    const embed = await embedding(parameters.description);

    await sql`
      update entities set ${sql({
        world_id: worldId,
        name: parameters.name,
        description: parameters.description,
        classification: parameters.classification,
        embedding: JSON.stringify(embed),
      })} where id = ${entityId}
    `;

    return { result: 'Entity Updated' };
  }
}

export class EntityBuilder extends LLMSubsystem {
  description = 'Responsible for creating new entities';
  actions = [ChooseGender, ChooseOrigin, CreateEntity, ModifyEntity];
  agentPurpose =
    'You are superintelligent entity designer for a perisistent video-game world. Your job is to create or modify the requested entity in a way that fits into the world, and the story.';
  model = 'gpt-4-0613' as const;
  temperature = 1;

  override async instructions(): Promise<string[]> {
    // if entity exists, load entity data
    // simple changes are queued for agent, but not brought up until either a) a complex change is made or b) the character is finialized

    let entity: any = null;
    let entityChangeHistory = 'None';

    if (this.thoughtProcess.data.entity_id) {
      const entityRes = await sql`select * from entities where id = ${this.thoughtProcess.data.entity_id}`;
      entity = entityRes[0];

      if (entity) {
        entityChangeHistory = entity.change_history;
      }
    }

    // load relevant rules as reference
    const rulesQuestion = await embedding('What are the rules for creating characters, locations, and items?');

    const rules = await sql`select *, embedding <=> ${JSON.stringify(
      rulesQuestion
    )} as "distance" from rules where world_id = ${this.thoughtProcess.world_id} and embedding <=> ${JSON.stringify(
      rulesQuestion
    )} < 0.3 order by distance asc limit 10`;
    const rulesText = rules.map(r => r.plain).join('\n');

    // load relevant stories
    const stories = await sql`select * from stories where world_id = ${this.thoughtProcess.world_id} limit 10`;
    const storiesText = stories.map(s => s.text).join('\n');

    const worlds = await sql`select worlds.* from worlds where id = ${this.thoughtProcess.world_id}`;
    const world = worlds[0];

    return [
      ...(!entity
        ? [
            'Possible entity classifications are exclusively: character, location, item, organization',
            'If the entity should be a character, start by generating a gender and origin as inspiration for the character properties',
            'If the entity should be a location or item, start by generating an origin as inspiration for the location properties',
            "Characters should have first and last names, unless it's an explicit choice to have a single word name",
            'Once you have the necessary inspiration, create the entity',
          ]
        : []),
      `Consider this World Description: ${world.description}`,
      `Consider these Stories: ${storiesText}`,
      `Follow these rules:\n${rulesText}\n\n`,
      entity && 'Make the modifications to the entity that are requested',
      entity && `Previous Entity Changes:\n${entityChangeHistory}`,
      entity && `Current Entity:\n${JSON.stringify(entity)}`,
    ];
  }
}
