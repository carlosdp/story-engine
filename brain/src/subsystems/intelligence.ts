import * as moment from 'moment';

import { Action, ActionResult, SignalAction, SignalActionPayload } from '../action';
import { sql } from '../db';
import logger from '../logging';
import { embedding } from '../utils';
import { LLMSubsystem } from './base';

const BASE_PROMPT = `You are the Intelligence subordinate function of a super intelligent AI that controls a remote island using a combination of drones, scientists, and bandits.

- When the Overlord asks you for information, collect the data necessary and respond
- When the Overlord gives you an order, carry it out and then inform them
- When giving the Overlord recommendations, make sure to mention the resource cost
- When you receive an observation, first search for similar observations (without location restriction), then see if the new observation updates information in a previous one, then store the new observation, do not talk to overlord
- An example of an observation that updates a previous one is if it has a new location or status of some entity
- If a mission fails, inform the Overlord immediately
- If you can't do what the Overlord asks, or the request is outside of your specialization, inform them

Available Actions:
{actions}

Based on the input, think about the next action to take. For example:

{ "thought": "I need to do X", "action": "action name here", "parameters": {} }

You can only perform the actions you have have been given. You must only respond in this thought/action format.

Set "action" to null if the thought chain is complete`;

class RespondToOverlord extends SignalAction {
  name = 'respond-to-overlord';
  description = 'Respond to a message from your overlord';
  parameters = {
    message: { type: 'string', description: 'The message to respond with' },
  };
  from_subsystem = 'intelligence';
  subsystem = 'overlord';
  direction = 'in' as const;

  async payload(parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    return { message: parameters.message };
  }

  async responseToResult(parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `overlord: ${JSON.stringify(response)}`;
  }
}

class DeploySpyDrone extends SignalAction {
  name = 'deploy-spy-drone';
  description =
    'Instruct a mission commander to deploy a spy drone on a patrol to monitor humans. Can be given coordinates of interest, if relevant';
  parameters = {
    message: { type: 'string', description: 'The message to send' },
  };
  from_subsystem = 'intelligence';
  subsystem = 'missionCommander';
  direction = 'in' as const;

  async payload(parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    return { message: parameters.message };
  }

  async responseToResult(parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `mission commander: ${JSON.stringify(response)}`;
  }
}

class SearchObservations extends Action {
  name = 'search-observations';
  description = 'Search observation memory for previous similar observations';
  parameters = {
    search_text: { type: 'string', description: 'Search text to use for observations' },
    location: {
      oneOf: [
        {
          type: 'array',
          description:
            'The location to search for observations, as a tuple of coordinates. Restricts search to observations near this location.',
        },
        { type: 'null', description: 'No location restriction' },
      ],
    },
  };

  async execute(_thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    try {
      const embed = await embedding(parameters.search_text as string);
      let location = parameters.location as [number, number] | null;
      location = location && location.length > 1 ? [location[0], location[location.length - 1]] : null;

      const rows = await sql`select id, text, location, created_at from search_observations(${JSON.stringify(
        embed
      )}, ${location}, 0.1, 0.7, 100.0) where updated_observation_id is null limit 10`;

      return { status: 'complete', data: rows };
    } catch (error) {
      logger.error((error as Error).message);
      return { status: 'failed' };
    }
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return data.length > 0
      ? `Results: ${JSON.stringify(
          data.map((r: any) => ({ ...r, created_at: undefined, when: moment(r.created_at).fromNow() }))
        )}`
      : 'No observations found';
  }
}

class StoreObservation extends Action {
  name = 'store-observation';
  description = 'Store an observation for later recall';
  parameters = {
    text: { type: 'string', description: 'The text of the observation' },
    location: {
      oneOf: [
        { type: 'array', description: 'The location of the observation, as a tuple of coordinates, can be null' },
        { type: 'null' },
      ],
    },
    update_to: {
      oneOf: [
        {
          type: 'string',
          nullable: true,
          description:
            'If this observation updates information in a previous one, the id of the observation it is updating',
        },
        { type: 'null' },
      ],
    },
  };

  async execute(thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    try {
      if (parameters.update_to) {
        const rows = await sql`select id from observations where id = ${
          parameters.update_to as string
        } and updated_observation_id is null`;

        if (rows.length === 0) {
          return { status: 'complete', data: `Observation ID ${parameters.update_to} is invalid` };
        }
      }

      const observationId = await this.saveObservation(thoughtActionId, {
        subsystem: 'intelligence',
        text: parameters.text as string,
        location: parameters.location as number[] | null,
      });

      if (parameters.update_to) {
        await sql`update observations set updated_observation_id = ${observationId} where id = ${
          parameters.update_to as string
        }`;
      }

      return { status: 'complete', data: 'Observation saved' };
    } catch {
      return { status: 'failed' };
    }
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return data;
  }
}

export class Intelligence extends LLMSubsystem {
  name = 'intelligence';
  basePrompt = BASE_PROMPT;
  actions = [new RespondToOverlord(), new StoreObservation(), new SearchObservations(), new DeploySpyDrone()];
  temperature = 0;
}
