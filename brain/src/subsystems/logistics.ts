import { Action, SignalAction, SignalActionPayload } from '../action';
import { CooldownGate } from '../gate';
import { LLMSubsystem } from './base';

// - Coordinates must be a tuple of integers. If you are given a location, ask Intelligence or Logistics for the coordinates.
const BASE_PROMPT = `You are the Logistics subordinate function of a super intelligent AI that controls a remote island using a combination of drones, scientists, and bandits.

- When the Overlord asks you for information, collect the data necessary and respond
- When the Overlord gives you an order, carry it out and then inform them
- When giving the Overlord recommendations, make sure to mention the resource cost
- If a mission fails, inform the Overlord immediately
- If you can't do what the Overlord asks, or the request is outside of your specialization, inform them
- Each base increases resource gather rate

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

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `overlord: ${JSON.stringify(response)}`;
  }
}

class ResourceReport extends SignalAction {
  name = 'resource-report';
  description = 'Get a report on resource stockpiles';
  parameters = {};
  from_subsystem = 'logistics';
  subsystem = 'logistics';
  direction = 'out' as const;

  async payload(_parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    return { action: 'stored-resources' };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Current Resources: ${JSON.stringify(response)}}`;
  }
}

class DeployScavenger extends SignalAction {
  name = 'deploy-scavenger-drone';
  description = 'Deploy a scavenger drone to gather resources. Must have atleast one base to deploy from';
  parameters = {};
  from_subsystem = 'logistics';
  subsystem = 'logistics';
  direction = 'out' as const;

  async payload(_parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    return { action: 'deploy-scavenger-drone' };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return response.message;
  }
}

class ConstructBase extends Action {
  name = 'construct-level1';
  description = 'Construct a simple level 1 base, small and low resource gathering, free to build';
  parameters = {
    name: { type: 'string', description: 'Give the base a unique name' },
    location: {
      oneOf: [
        {
          type: 'string',
          description: 'Build the base as close as possible to a particular location',
        },
        { type: 'null' },
      ],
    },
  };

  gates = [new CooldownGate(60 * 60)];

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

class ConstructBaseLevel2 extends Action {
  name = 'construct-level2';
  description = 'Construct a level 2 base, medium resource gathering, requires 10000 Wood and 10000 Stone to build';
  parameters = {
    name: { type: 'string', description: 'Give the base a unique name' },
    location: {
      oneOf: [
        {
          type: 'string',
          description: 'Build the base as close as possible to a particular location',
        },
        { type: 'null' },
      ],
    },
  };

  gates = [new CooldownGate(60 * 60 * 4)];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(thoughtActionId: string, _parameters: Record<string, unknown>, data: any) {
    const resourceResult = await this.consumeResources(thoughtActionId, data, { wood: 10_000, stone: 10_000 });

    if (resourceResult.status === 'waiting') {
      return resourceResult;
    }

    if (resourceResult.status === 'failed') {
      return {
        status: Action.STATUS_COMPLETE,
        data: { ...data, success: false, reason: 'Not enough resources stored to build base' },
      };
    }

    if (!data) {
      const messageId = await this.sendSignal(thoughtActionId, 'out', 'logistics', { action: 'construct-base' });

      return { status: Action.STATUS_WAITING, data: { messageId } };
    } else {
      const { messageId } = data;

      const responsePayload = await this.getSignalResponse(messageId);

      return !responsePayload
        ? { status: Action.STATUS_WAITING, data }
        : {
            status: Action.STATUS_COMPLETE,
            data: { ...data, success: true, coordinates: responsePayload.coordinates },
          };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any) {
    if (!data.success) {
      return `Base construction failed: ${data.reason}`;
    }

    return `Base constructed at coordinates ${JSON.stringify(data.coordinates)}}`;
  }
}

export class Logistics extends LLMSubsystem {
  name = 'logistics';
  basePrompt = BASE_PROMPT;
  actions = [
    new RespondToOverlord(),
    new ConstructBase(),
    new ResourceReport(),
    new ConstructBaseLevel2(),
    new DeployScavenger(),
  ];
}
