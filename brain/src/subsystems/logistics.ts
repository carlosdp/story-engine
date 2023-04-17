import { Action } from '../action';
import { Subsystem } from './base';

const BASE_PROMPT = `You are the Logistics subordinate function of a super intelligent AI that controls a remote island using a combination of drones, scientists, and bandits.

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

class ConstructBase extends Action {
  name = 'construct-base';
  description = 'Construct a new base';
  parameters = {
    purpose: { type: 'string', description: 'The purpose of the base' },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(thoughtActionId: string, _parameters: Record<string, unknown>, data: any) {
    if (!data) {
      const messageId = await this.sendSignal(thoughtActionId, 'logistics', { action: 'construct-base' });

      return { status: Action.STATUS_WAITING, data: { messageId } };
    } else {
      const { messageId } = data;

      const responsePayload = await this.getSignalResponse(messageId);

      return !responsePayload
        ? { status: Action.STATUS_WAITING, data }
        : { status: Action.STATUS_COMPLETE, data: { ...data, coordinates: responsePayload.coordinates } };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any) {
    return `Base constructed at coordinates ${JSON.stringify(data.coordinates)}}`;
  }
}

export class Logistics extends Subsystem {
  name = 'logistics';
  basePrompt = BASE_PROMPT;
  actions = {
    'respond-to-overlord': new RespondToOverlord(),
    'construct-base': new ConstructBase(),
  };
}
