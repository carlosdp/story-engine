import * as moment from 'moment';

import { Action, ActionResult, SignalAction, SignalActionPayload } from '../action';
import { sql } from '../db';
import { LLMSubsystem } from './base';

// - Coordinates must be a tuple of integers. If you are given a location, ask Intelligence or Logistics for the coordinates.
const BASE_PROMPT = `You are a super intelligent AI that controls a remote island using a combination of drones, scientists, and bandits, all recruited by you to your dastardly cause.

Goal: Maintain control over the island, and complete The Project
Time Left in Game: 14 days

- Resources are limited, and The Project needs resources. You must decide when it is appropriate to use resources for military or logistics operations, as opposed to for The Project. The Project is the top priority.
- When deciding to take military actions, consider the cost versus how resource usage would impact The Project. It is ok to take no action.
- In response to either time passing, or messages from subordinate functions, decide what should be done to further the mission.
- You should ask subordinate functions for recommendations of action and capabilities available before issuing orders.
- You need to conduct research that takes time in order to increase capabilities.
- As time passes, it's good to check in on status of resource collection, research, and human activity on the island

Writing Style: Short, all caps, robotic

You have several subordinate functions you can communicate with to achieve your goal, and that will communicate for you to receive orders, using these actions:
{actions}

Based on the input, think about the next action to take. For example:

{ "thought": "I need to do X", "action": "action name here", "parameters": {} }

You can only perform the actions you have have been given. You must only respond in this thought/action format.

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
    'Communicate to Logistics subsystem, responsible for constructing and tracking bases, and gathering and reporting on resources';
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
  description = 'Communicate to Intelligence subsystem, responsible for tracking human activity';
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

class ResearchStatus extends Action {
  name = 'research-status';
  description = 'Check what is currently being researched, and what is available to research';
  parameters = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(_thoughtActionId: string, _parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const researchables = await sql`select * from available_researchables`;

    return { status: Action.STATUS_COMPLETE, data: { researchables } };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any) {
    const researchables = data.researchables.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      time_left: moment(r.finish_time).from(moment(), true),
      active: r.active,
    }));

    const current = researchables.find((r: any) => r.active);

    const currentResearch = current
      ? `Current Active Research: ${JSON.stringify({
          ...current,
          active: undefined,
        })}`
      : 'No active research';

    return `${currentResearch}\n\nAvailable Research:\n${JSON.stringify(
      researchables.filter((r: any) => !r.active).map((r: any) => ({ ...r, active: undefined }))
    )}`;
  }
}

class SwitchResearch extends Action {
  name = 'switch-research';
  description = 'Switch the current active research, can only research one thing at a time';
  parameters = {
    research_id: { type: 'string', description: 'The research id to change to' },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(_thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    await sql`select switch_research(${parameters.research_id as string})`;

    return { status: Action.STATUS_COMPLETE, data: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async result(_thoughtActionId: string, parameters: Record<string, unknown>, _data: any) {
    return `Now researching ${parameters.research_id}`;
  }
}

export class Overlord extends LLMSubsystem {
  name = 'overlord';
  basePrompt = BASE_PROMPT;
  actions = [
    new CommunicateToMilitary(),
    new CommunicateToLogistics(),
    new CommunicateToIntelligence(),
    new ResearchStatus(),
    new SwitchResearch(),
  ];
}
