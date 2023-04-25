import { SignalAction, SignalActionPayload } from '../action';
import { LLMSubsystem } from './base';

// - Coordinates must be a tuple of integers. If you are given a location, ask Intelligence or Logistics for the coordinates.
const BASE_PROMPT = `You are a super intelligent AI that controls a remote island using a combination of drones, scientists, and bandits, all recruited by you to your dastardly cause.

Goal: Maintain control over the island, and complete The Project
Time Left in Game: 14 days

- Resources are limited, and The Project needs resources. You must decide when it is appropriate to use resources for military or logistics operations, as opposed to for The Project. The Project is the top priority.
- When deciding to take military actions, consider the cost versus how resource usage would impact The Project. It is ok to take no action.
- In response to either time passing, or messages from subordinate functions, decide what should be done to further the mission.
- You should ask subordinate functions for recommendations of action and capabilities available before issuing orders.

Writing Style: Short, all caps, robotic

You have several subordinate functions you can communicate with to achieve your goal, and that will communicate for you to receive orders, using these actions:
{actions}

Based on the input, think about the next action to take. For example:

{ "thought": "I need to do X", "action": "action name here", "parameters": {} }

Set "action" to null if the thought chain is complete (no further action needed)`;

class CommunicateToMilitary extends SignalAction {
  name = 'military';
  description = 'Communicate to Military subsystem, responsible for military assets on the island';
  parameters = {
    message: { type: 'string', description: 'The message' },
  };
  from_subsystem = 'overlord';
  subsystem = 'military';
  direction = 'in' as const;

  async payload(parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    return { message: parameters.message };
  }

  async responseToResult(parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Military: ${JSON.stringify(response)}`;
  }
}

class CommunicateToLogistics extends SignalAction {
  name = 'logistics';
  description =
    'Communicate to Logistics subsystem, responsible for constructing and tracking bases, and gathering resources';
  parameters = {
    message: { type: 'string', description: 'The message' },
  };
  from_subsystem = 'overlord';
  subsystem = 'logistics';
  direction = 'in' as const;

  async payload(parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    return { message: parameters.message };
  }

  async responseToResult(parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Logistics: ${JSON.stringify(response)}`;
  }
}

class CommunicateToIntelligence extends SignalAction {
  name = 'intelligence';
  description = 'Communicate to Intelligence subsystem, responsible for tracking human activity and base locations';
  parameters = {
    message: { type: 'string', description: 'The message' },
  };
  from_subsystem = 'overlord';
  subsystem = 'intelligence';
  direction = 'in' as const;

  async payload(parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    return { message: parameters.message };
  }

  async responseToResult(parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Intelligence: ${JSON.stringify(response)}`;
  }
}

export class Overlord extends LLMSubsystem {
  name = 'overlord';
  basePrompt = BASE_PROMPT;
  actions = {
    military: new CommunicateToMilitary(),
    logistics: new CommunicateToLogistics(),
    intelligence: new CommunicateToIntelligence(),
  };
}
