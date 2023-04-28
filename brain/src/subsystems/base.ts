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

export type Subsystem = {
  processSignal(message: SubsystemMessage): Promise<string>;
  continueProcessing(thoughtProcessId: string, completedActionId: string): Promise<string>;
  getAction(name: string): Action | undefined;
};

export abstract class LLMSubsystem implements Subsystem {
  abstract name: string;
  abstract basePrompt: string;
  abstract actions: Action[];

  model: 'gpt-3.5-turbo' | 'gpt-4' = 'gpt-4';
  temperature = 0.4;

  private cachedAvailableActions: Record<string, Action> | null = null;

  getAction(name: string) {
    return this.actions.find(action => action.name === name);
  }

  async availableActions() {
    if (!this.cachedAvailableActions) {
      // call async isAvailable for all actions
      const availableActions = await Promise.all(
        this.actions.map(async action => {
          const isAvailable = await action.isAvailable();
          return isAvailable ? action : null;
        })
      );

      this.cachedAvailableActions = Object.fromEntries(
        availableActions.filter(action => action !== null).map(action => [action!.name, action!])
      );
    }

    return this.cachedAvailableActions;
  }

  async processSignal(message: SubsystemMessage) {
    const basePrompt = this.basePrompt.replace(
      '{actions}',
      Object.values(await this.availableActions())
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

    const response = await this.processMessages(thoughtProcessId, startingMessages);

    startingMessages.push(response);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const response = await this.processMessages(thoughtProcessId, messages);

    messages.push(response);

    await sql`update thought_processes set messages = ${messages} where id = ${thoughtProcessId}`;

    return thoughtProcessId;
  }

  async processMessages(thoughtProcessId: string, messages: { role: string; content: string }[]) {
    let attemptsLeft = 3;
    const debugMessages: { role: string; content: string }[] = [];
    let response: { role: string; content: string } = { role: 'system', content: 'No response' };

    while (attemptsLeft > 0) {
      response = await rawMessage(
        this.model,
        [...messages, ...debugMessages, { role: 'system', content: 'Respond in pure JSON only' }],
        400,
        this.temperature
      );
      logger.debug(response.content);

      const actionCommand = JSON.parse(response.content) as ActionCommand;

      if (!actionCommand.action) {
        logger.debug('No action, returning');
        return response;
      }

      const availableActions = await this.availableActions();
      const action = availableActions[actionCommand.action];

      if (!action) {
        logger.warn(`Invalid action: ${actionCommand.action}`);

        debugMessages.push(response, {
          role: 'system',
          content: `Invalid action: ${actionCommand.action}. Use only available actions.`,
        });

        attemptsLeft -= 1;
        continue;
      }

      const validationResult = action.validate(actionCommand.parameters);

      if (!validationResult.valid) {
        logger.warn(`Invalid parameters: ${JSON.stringify(validationResult.errors)}`);

        debugMessages.push(response, {
          role: 'system',
          content: `Invalid action parameters: ${JSON.stringify(validationResult.errors)}. Follow the schema.`,
        });

        attemptsLeft -= 1;
        continue;
      }

      await action.queue(thoughtProcessId, actionCommand.parameters);

      break;
    }

    return response;
  }
}

export abstract class DeterministicSubsystem implements Subsystem {
  abstract name: string;
  abstract actions: Action[];

  getAction(name: string) {
    return this.actions.find(action => action.name === name);
  }

  async processSignal(message: SubsystemMessage) {
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
      messages: [],
    })} returning id`;

    const thoughtProcessId = thoughtProcessRes[0].id;
    const actionCommand = message.payload as ActionCommand;

    if (!actionCommand.action) {
      logger.debug('No action, returning');
      return thoughtProcessId;
    }

    const action = this.getAction(actionCommand.action);

    if (!action) {
      logger.warn(`Invalid action: ${actionCommand.action}`);

      return thoughtProcessId;
    }

    await action.queue(thoughtProcessId, actionCommand.parameters);

    return thoughtProcessId;
  }

  async continueProcessing(thoughtProcessId: string, completedActionId: string) {
    const thoughtProcessRes = await sql`select * from thought_processes where id = ${thoughtProcessId}`;
    const thoughtProcess = thoughtProcessRes[0];

    const initiatingSignalRes = await sql`select * from messages where id = ${thoughtProcess.initiating_message_id}`;
    const initiatingSignal = initiatingSignalRes[0];

    const actionRes = await sql`select * from thought_process_actions where id = ${completedActionId}`;
    const completedAction = actionRes[0];

    const result = completedAction.result;

    await sql`insert into messages ${sql({
      type: 'signal',
      response_to: initiatingSignal.id,
      direction: initiatingSignal.from_subsystem ? 'in' : 'out',
      subsystem: initiatingSignal.from_subsystem ?? this.name,
      from_subsystem: this.name,
      payload: result,
    })}`;

    return thoughtProcessId;
  }
}
