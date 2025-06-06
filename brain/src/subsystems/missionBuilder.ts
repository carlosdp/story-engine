import { Action, ActionResult } from '../action.js';
import { sql } from '../db.js';
import { LLMSubsystem } from './base.js';

class MissionGraph extends Action {
  description = 'Define a mission graph for a player or NPC character';
  parameters = {
    storylineId: { type: 'string', description: 'The id of the storyline' },
    characterId: { type: 'string', description: 'The id of the character to assign the mission to' },
    objectives: {
      type: 'array',
      description: 'List of objectives for the mission',
      items: {
        type: 'object',
        properties: {
          instructions: { type: 'string', description: 'Instructions for the objective' },
          prerequisites: {
            type: 'array',
            description:
              'List of indexes in this objectives array for objectives that need to be completed before this one is active',
            items: { type: 'number' },
          },
          data: {
            type: 'object',
            description: 'The data for this objective',
            properties: {
              type: {
                type: 'string',
                description: 'the objective type',
                parameters: { type: 'object', description: 'the parameters for this objective' },
              },
            },
          },
        },
      },
    },
  };

  async execute(_thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const missions = await sql`insert into missions ${sql({
      storyline_id: parameters.storylineId as string,
    })} returning id`;
    const missionId = missions[0].id;

    await sql`insert into mission_characters ${sql({
      mission_id: missionId,
      character_id: parameters.characterId as string,
    })}`;

    const objectives = parameters.objectives as Array<any>;

    const missionObjectives = await sql`insert into mission_objectives ${sql(
      objectives.map((objective: any) => ({
        mission_id: missionId,
        instructions: objective.instructions,
        data: objective.data,
      }))
    )} returning id`;

    for (const [index, objective] of objectives.entries()) {
      const prerequisites = objective.prerequisites as Array<number>;
      if (prerequisites.length > 0) {
        const prerequisiteId = missionObjectives[prerequisites[0]].id;
        await sql`update mission_objectives set prerequisite_id = ${prerequisiteId} where id = ${missionObjectives[index].id}`;
      }
    }

    return { status: 'complete', data: 'Mission Graph created succesfully' };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return data;
  }
}

export class MissionBuilder extends LLMSubsystem {
  description = 'Responsible for managing missions';
  actions = [MissionGraph];
  agentPurpose =
    'You are superintelligent mission designer for a perisistent video-game world. Your job is to take a given storyline, and generate a Mission Graph that will be used by a game engine to implement the story in the game world.';
  model = 'gpt-4' as const;
  temperature = 0;

  override async instructions(): Promise<string[]> {
    return [
      'You can make one or more Mission Graphs, which can be assigned to player characters',
      'Objective data match one of the provided objective type data schemas',
      'Only create the minimal objectives necessary to implement the story',
      `Objective type data schemas:
      talk: Go and talk to a character. There shouldn't be two talk objectives for the same character one after the other, simply add more to the context if there are multiple topics to talk about.
      parameters: { "character": { "type": "string", "description": "id of character to talk to" }, "context": { "type": "string", "description": "a description of what the conversation should be about" } }`,
    ];
  }
}
