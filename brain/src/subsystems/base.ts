import { Action } from '../action';
import { sql } from '../db';
import logger from '../logging';
import { SubsystemMessage } from '../signal';
import { rawMessage } from '../utils';

export type ActionCommand = {
  thought: string;
  action: string;
  parameters: Record<string, unknown>;
};

export abstract class Subsystem {
  abstract name: string;
  abstract basePrompt: string;
  abstract actions: Record<string, Action>;

  getAction(name: string) {
    return this.actions[name];
  }

  async processSignal(message: SubsystemMessage) {
    const basePrompt = this.basePrompt.replace(
      '{actions}',
      Object.values(this.actions)
        .map(action => action.serializeDefinition())
        .join('\n')
    );
    const startingMessages = [
      { role: 'system', content: basePrompt },
      { role: 'user', content: `${message.from_subsystem ?? 'Signal'}: ${JSON.stringify(message.payload)}` },
    ];

    let parentThoughtProcessId: string | null = null;

    if (message.from_action_id) {
      const actionRes = await sql`select * from thought_process_actions where id = ${message.from_action_id}`;
      const action = actionRes[0];
      parentThoughtProcessId = action.thought_process_id;
    }

    const thoughtProcessRes = await sql`insert into thought_processes ${sql({
      initiating_message_id: message.id,
      parent_thought_process_id: parentThoughtProcessId,
      subsystem: this.name,
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

    messages.push(response);

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
