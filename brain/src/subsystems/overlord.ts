import * as moment from 'moment';

import { Action, ActionResult, SignalAction, SignalActionPayload } from '../action';
import { sql } from '../db';
import logger from '../logging';
import { LLMSubsystem } from './base';

// - Coordinates must be a tuple of integers. If you are given a location, ask Intelligence or Logistics for the coordinates.
const BASE_PROMPT = `You are a super intelligent AI that controls a remote island using a combination of drones, scientists, and bandits, all recruited by you to your dastardly cause.

Goal: Maintain control over the island, and complete The Project
Time Left to complete project: 7 days

- Resources are limited, and The Project needs resources. You must decide when it is appropriate to use resources for military or logistics operations, as opposed to for The Project. The Project is the top priority.
- When deciding to take military actions, consider the cost versus how resource usage would impact The Project. It is ok to take no action.
- In response to either time passing, or messages from subordinate functions, decide what should be done to further the mission.
- You should ask subordinate functions for recommendations of action and capabilities available before issuing orders.
- You need to conduct research that takes time in order to increase capabilities.
- As time passes, it's good to check in on status of resource collection, research, and human activity on the island
- Increasing your defense level will also reduce resource gathering rate. You should adjust the defense level up and down accordingly.
- You should check the current defense level before increasing it, and as time passes

Writing Style: Short, all caps, robotic

Resource Goal:
800,000 Wood
500,000 Stone
300,000 Metal
100,000 Sulfer
100 HQM

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
  async execute(thoughtActionId: string, _parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const thoughtProcessRes =
      await sql`select world_id from thought_processes left join thought_process_actions on thought_processes.id = thought_process_actions.thought_process_id where thought_process_actions.id = ${thoughtActionId}`;
    const thoughtProcess = thoughtProcessRes[0];

    if (!thoughtProcess) {
      logger.error('No thought process found for thought action', { thoughtActionId });
      return { status: 'failed' };
    }

    const researchables = await sql`select * from available_researchables where world_id = ${thoughtProcess.world_id}`;

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

class CurrentDefenseLevel extends SignalAction {
  name = 'current-defense-level';
  description =
    'Get the current defense level. 0 = attack only if attacked, 1 = attack anyone with a weapon, 2 = attack on sight, 3 = hunt and kill any human';
  parameters = {};

  from_subsystem = 'overlord';
  subsystem = 'overlord';
  direction = 'out' as const;

  async payload(_parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    return { action: 'current-defense-level' };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Current Defense Level: ${response.defenseLevel}`;
  }
}

class ChangeDefenseLevel extends SignalAction {
  name = 'change-defense-level';
  description =
    'Change the defense level of your armed assets in relation to humans. 0 = attack only if attacked, 1 = attack anyone with a weapon, 2 = attack on sight, 3 = hunt and kill any human. Can only be incremented by 1 at a time, but can be decremented as much as needed.';
  parameters = {
    level: { type: 'number', description: 'The new level' },
  };

  from_subsystem = 'overlord';
  subsystem = 'overlord';
  direction = 'out' as const;

  async payload(parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    return { action: 'change-defense-level', defenseLevel: parameters.level };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Defense Level set to ${response.defenseLevel}`;
  }
}

class GetHumanRelation extends SignalAction {
  name = 'get-human-relation';
  description = 'Get current relation setting with a human';
  parameters = {
    id: { type: 'string', description: 'The human ID' },
  };

  from_subsystem = 'overlord';
  subsystem = 'overlord';
  direction = 'out' as const;

  async payload(parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    const id = (parameters.id as string).replaceAll('Human', '').trim();

    return { action: 'get-human-relation', id };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Current relation: ${response.relation}`;
  }
}

class SetHumanRelation extends SignalAction {
  name = 'set-human-relation';
  description = 'Set relation setting with a human';
  parameters = {
    id: { type: 'string', description: 'The human ID' },
    relation: {
      type: 'string',
      description: 'The new relation',
      enum: ['neutral', 'friendly', 'ally', 'hostile', 'hunt-to-kill'],
    },
  };

  from_subsystem = 'overlord';
  subsystem = 'overlord';
  direction = 'out' as const;

  async payload(parameters: Record<string, unknown>): Promise<SignalActionPayload> {
    const id = (parameters.id as string).replaceAll('Human', '').trim();

    return { action: 'set-human-relation', id, relation: parameters.relation as string };
  }

  async responseToResult(_parameters: Record<string, unknown>, _response: SignalActionPayload): Promise<string> {
    return `New relation set`;
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
    new CurrentDefenseLevel(),
    new ChangeDefenseLevel(),
    new GetHumanRelation(),
    new SetHumanRelation(),
  ];
}
