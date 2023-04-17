import { Action } from '../action';
import { sql } from '../db';
import logger from '../logging';
import { SubsystemMessage } from '../signal';
import { rawMessage } from '../utils';

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

type ActionCommand = {
  thought: string;
  action: string;
  parameters: Record<string, unknown>;
};

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

export class Military {
  actions: Record<string, Action>;

  constructor() {
    this.actions = {
      'respond-to-overlord': new RespondToOverlord(),
      'check-existing-military-assets': new CheckExistingMilitaryAssets(),
      'place-on-guard': new PlaceOnGuard(),
    };
  }

  getAction(name: string) {
    return this.actions[name];
  }

  async processSignal(message: SubsystemMessage) {
    const basePrompt = BASE_PROMPT.replace(
      '{actions}',
      Object.values(this.actions)
        .map(action => action.serializeDefinition())
        .join('\n')
    );
    const startingMessages = [
      { role: 'system', content: basePrompt },
      { role: 'user', content: `${message.from_subsystem ?? 'Signal'}: ${JSON.stringify(message.payload)}` },
    ];

    const thoughtProcessRes = await sql`insert into thought_processes ${sql({
      subsystem: 'military',
      messages: startingMessages,
    })} returning id`;
    const thoughtProcessId = thoughtProcessRes[0].id;

    const response = await rawMessage(
      'gpt-4',
      [...startingMessages, { role: 'system', content: 'Respond in pure JSON only' }],
      400,
      0.4
    );
    logger.debug(response.content);

    const actionCommand = JSON.parse(response.content) as ActionCommand;

    if (!actionCommand.action) {
      logger.debug('No action, returning');
      return thoughtProcessId;
    }

    const action = this.actions[actionCommand.action];

    if (!action) {
      throw new Error(`Invalid action: ${actionCommand.action}`);
    }

    await action.queue(thoughtProcessId, actionCommand.parameters);

    startingMessages.push(response);

    await sql`update thought_processes set messages = ${startingMessages as any[]} where id = ${thoughtProcessId}`;

    return thoughtProcessId;
  }

  async continueProcessing(thoughtProcessId: string, completedActionId: string) {
    const thoughtProcessRes = await sql`select * from thought_processes where id = ${thoughtProcessId}`;
    const thoughtProcess = thoughtProcessRes[0];

    const messages = thoughtProcess.messages;

    const actionRes = await sql`select * from thought_process_actions where id = ${completedActionId}`;
    const completedAction = actionRes[0];

    messages.push({ role: 'user', content: completedAction.result });

    const response = await rawMessage(
      'gpt-4',
      [...messages, { role: 'system', content: 'Respond in pure JSON only' }],
      400,
      0.4
    );
    logger.debug(response.content);

    await sql`update thought_processes set messages = ${messages} where id = ${thoughtProcessId}`;

    const actionCommand = JSON.parse(response.content) as ActionCommand;

    if (!actionCommand.action) {
      logger.debug('No action, returning');
      return thoughtProcessId;
    }

    const action = this.actions[actionCommand.action];

    if (!action) {
      throw new Error(`Invalid action: ${actionCommand.action}`);
    }

    await action.queue(thoughtProcessId, actionCommand.parameters);
  }
}
