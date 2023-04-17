import { Action } from '../action';
import { Subsystem } from './base';

const BASE_PROMPT = `You are the Military subordinate function of a super intelligent AI that controls a remote island using a combination of drones, scientists, and bandits.

- When the Overlord asks you for information, collect the data necessary and respond
- When the Overlord gives you an order, carry it out and then inform them
- Coordinates must be a tuple of integers. If you are given a location, ask Intelligence or Logistics for the coordinates.
- When giving the Overlord recommendations, make sure to mention the resource cost
- If a mission fails, inform the Overlord immediately

Available Actions:
{actions}

Based on the input, think about the next action to take. For example:

{ "thought": "I need to do X", "action": "action name here", "parameters": {} }

Set "action" to null" if the though chain is complete`;

class RespondToOverlord extends Action {
  name = 'respond-to-overlord';
  description = 'Respond to a message from your overlord';
  parameters = {
    message: { type: 'string', description: 'The message to respond with' },
  };

  async execute(_thoughtProcessId: string, _parameters: Record<string, unknown>, _data: any) {
    return { status: Action.STATUS_WAITING, data: {} };
  }

  async result(_thoughtProcessId: string, _parameters: Record<string, unknown>, _data: any) {
    return 'Failed to respond to overlord';
  }
}

class CheckExistingMilitaryAssets extends Action {
  name = 'check-existing-military-assets';
  description = 'Check for existing military assets near coordinates';
  parameters = {
    coordinates: { type: 'array', description: 'The coordinates to check, as a tuple of integers' },
  };

  async execute(_thoughtProcessId: string, _parameters: Record<string, unknown>, _data: any) {
    return { status: Action.STATUS_COMPLETE, data: { units: [] } };
  }

  async result(_thoughtProcessId: string, parameters: Record<string, unknown>, _data: any) {
    return `Found no military assets near coordinates ${JSON.stringify(parameters.coordinates)}}`;
  }
}

class PlaceOnGuard extends Action {
  name = 'place-on-guard';
  description = 'Place military assets on guard at coordinates';
  parameters = {
    coordinates: { type: 'array', description: 'The coordinates to check, as a tuple of integers' },
    meters: { type: 'number', description: 'The radius, in meters, to place the assets on guard' },
  };

  async execute(_thoughtProcessId: string, _parameters: Record<string, unknown>, _data: any) {
    return { status: Action.STATUS_COMPLETE, data: 'Guard placed' };
  }

  async result(_thoughtProcessId: string, _parameters: Record<string, unknown>, _data: any) {
    return 'Units in area now on guard';
  }
}

export class Military extends Subsystem {
  name = 'military';
  basePrompt = BASE_PROMPT;
  actions = {
    'respond-to-overlord': new RespondToOverlord(),
    'check-existing-military-assets': new CheckExistingMilitaryAssets(),
    'place-on-guard': new PlaceOnGuard(),
  };
}
