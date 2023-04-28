import { Action, SignalAction, SignalActionPayload } from '../action';
import { LLMSubsystem } from './base';

// - Coordinates must be a tuple of integers. If you are given a location, ask Intelligence or Logistics for the coordinates.
const BASE_PROMPT = `You are the Logistics subordinate function of a super intelligent AI that controls a remote island using a combination of drones, scientists, and bandits.

- When the Overlord asks you for information, collect the data necessary and respond
- When the Overlord gives you an order, carry it out and then inform them
- When giving the Overlord recommendations, make sure to mention the resource cost
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
  from_subsystem = 'logistics';
  subsystem = 'overlord';
  direction = 'in' as const;

  async payload(parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    return { message: parameters.message };
  }

  async responseToResult(parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `overlord: ${JSON.stringify(response)}`;
  }
}

class ResourceReport extends SignalAction {
  name = 'resource-report';
  description = 'Get a report on resource stockpiles';
  parameters = {};
  from_subsystem = 'logistics';
  subsystem = 'resourceDepot';
  direction = 'in' as const;

  async payload(_parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    return { action: 'resource-report', parameters: {} };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return JSON.stringify(response);
  }
}

class ConstructBase extends Action {
  name = 'construct-base';
  description = 'Construct a new base. Each base increases resource gather rate';
  parameters = {
    name: { type: 'string', description: 'Give the base a unique name' },
    location: {
      type: 'string',
      nullable: true,
      description: 'Build the base as close as possible to a particular location',
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(thoughtActionId: string, _parameters: Record<string, unknown>, data: any) {
    if (!data) {
      const messageId = await this.sendSignal(thoughtActionId, 'out', 'logistics', { action: 'construct-base' });

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

export class Logistics extends LLMSubsystem {
  name = 'logistics';
  basePrompt = BASE_PROMPT;
  actions = [new RespondToOverlord(), new ConstructBase(), new ResourceReport()];
}
