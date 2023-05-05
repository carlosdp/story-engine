import { Action, ActionResult, SignalAction, SignalActionPayload } from '../action';
import { LLMSubsystem } from './base';

const BASE_PROMPT = `You are the Mission Commander subordinate function of a super intelligent AI that controls a remote island using a combination of drones, scientists, and bandits.

- You will be given a mission by a superior function, your only goal is to complete the mission
- You should only communicate to the superior function that gave you the mission
- If you need more information about the mission, you can ask the superior function for certain details
- When designing paths, take into account the positions of any points of interest relevant to the mission
- If the mission does not include a target location, generate a random number and base a path on that
- Paths cannot be longer in length (the sum of distances between coordinates) than the max path distance of that asset
- Coordinates are expressed as [x, z], they are sometimes expressed as [x, elevation, z], but elevation is ignored

Island Size: 4500 units, coordinate [0,0] is at the center

Available Actions:
{actions}

Based on the input, think about the next action to take. For example:

{ "thought": "I need to do X", "action": "action name here", "parameters": {} }

You can only perform the actions you have have been given. You must only respond in this thought/action format.

Set "action" to null if the thought chain is complete`;

class RespondToInitiator extends SignalAction {
  name = 'respond-to-initiator';
  description = 'Respond to the initiator of this thought process';
  parameters = {
    subsystem: { type: 'string', description: 'The subsystem to respond to ' },
    message: { type: 'string', description: 'The message to respond with' },
  };
  subsystem = 'not_implemented';
  from_subsystem = 'missionCommander';
  direction = 'in' as const;

  async payload(parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    this.subsystem = parameters.subsystem as string;

    return { message: parameters.message };
  }

  async responseToResult(parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `${parameters.subsystem}: ${JSON.stringify(response)}`;
  }
}

class DeploySpyDrone extends SignalAction {
  name = 'deploy-spy-drone';
  description = 'Deploy a spy drone that follows the given path and reports to Intelligence';
  parameters = {
    path: {
      type: 'array',
      required: true,
      description: 'The path to follow, max distance is 1000',
      items: { type: 'array', items: { type: 'number' }, description: 'coordinates as tuples' },
    },
  };
  subsystem = 'intelligence';
  from_subsystem = 'missionCommander';
  direction = 'out' as const;

  async payload(parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    return { action: 'deploy-spy-drone', path: parameters.path };
  }

  async responseToResult(_parameters: Record<string, unknown>, _response: SignalActionPayload): Promise<string> {
    return 'Spy drone deployed and following path';
  }
}

class RandomNumber extends Action {
  name = 'random-number';
  description = 'Generate a random number in a range';
  parameters = {
    range: { type: 'array', items: { type: 'number' }, description: 'The range' },
  };

  async execute(_thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const range = parameters.range as number[];

    return {
      status: 'complete',
      data: Math.floor(Math.random() * (range[1] - range[0] + 1) + range[0]),
    };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return `Result: ${data}`;
  }
}

export class MissionCommander extends LLMSubsystem {
  name = 'missionCommander';
  basePrompt = BASE_PROMPT;
  actions = [new RespondToInitiator(), new DeploySpyDrone(), new RandomNumber()];
  temperature = 0.4;
}
