import { Action, SignalAction, SignalActionPayload } from '../action';
import { LLMSubsystem } from './base';

// - Coordinates must be a tuple of integers. If you are given a location, ask Intelligence or Logistics for the coordinates.
const BASE_PROMPT = `You are the Military subordinate function of a super intelligent AI that controls a remote island using a combination of drones, scientists, and bandits.

- When the Overlord asks you for information, collect the data necessary and respond
- When the Overlord gives you an order, carry it out and then inform them
- When giving the Overlord recommendations, make sure to mention the resource cost
- If a mission fails, inform the Overlord immediately
- If you can't do what the Overlord asks, or the request is outside of your specialization, inform them

Available Actions:
{actions}

Based on the input, think about the next action to take. For example:

{ "thought": "I need to do X", "action": "action name here", "parameters": {} }

You can only perform the actions you have have been given.

Set "action" to null" if the thought chain is complete`;

class RespondToOverlord extends SignalAction {
  name = 'respond-to-overlord';
  description = 'Respond to a message from your overlord';
  parameters = {
    message: { type: 'string', description: 'The message to respond with' },
  };
  from_subsystem = 'military';
  subsystem = 'overlord';
  direction = 'in' as const;

  async payload(parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    return { message: parameters.message };
  }

  async responseToResult(parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `overlord: ${JSON.stringify(response)}`;
  }
}

class CheckExistingMilitaryAssets extends Action {
  name = 'check-existing-military-assets';
  description = 'Check for existing military assets near coordinates';
  parameters = {
    coordinates: { type: 'array', description: 'The coordinates to check, as an x,y,z tuple of integers' },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(_thoughtProcessId: string, _parameters: Record<string, unknown>, _data: any) {
    return { status: Action.STATUS_COMPLETE, data: { units: [] } };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async result(_thoughtProcessId: string, parameters: Record<string, unknown>, _data: any) {
    return `Found no military assets near coordinates ${JSON.stringify(parameters.coordinates)}}`;
  }
}

class PlaceOnGuard extends Action {
  name = 'place-on-guard';
  description = 'Place military assets on guard at coordinates';
  parameters = {
    coordinates: { type: 'array', description: 'The coordinates to check, as an x,y,z tuple of integers' },
    meters: { type: 'number', description: 'The radius, in meters, to place the assets on guard' },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(_thoughtProcessId: string, _parameters: Record<string, unknown>, _data: any) {
    return { status: Action.STATUS_COMPLETE, data: 'Guard placed' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async result(_thoughtProcessId: string, _parameters: Record<string, unknown>, _data: any) {
    return 'Units in area now on guard';
  }
}

export class Military extends LLMSubsystem {
  name = 'military';
  basePrompt = BASE_PROMPT;
  actions = {
    'respond-to-overlord': new RespondToOverlord(),
    'check-existing-military-assets': new CheckExistingMilitaryAssets(),
    'place-on-guard': new PlaceOnGuard(),
  };
}
