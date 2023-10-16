import { Action, ActionConstructor, SignalActionPayload } from '../action';
import { sql } from '../db';
import logger from '../logging';
import { SubsystemMessage } from '../signal';
import type { Database } from '../supabaseTypes';
import { rawMessage } from '../utils';

export type ActionCommand = {
  thought: string;
  action: string;
  parameters: Record<string, unknown>;
};

export abstract class Thinker {
  abstract processSignal(message: SubsystemMessage): Promise<string>;
  abstract continueProcessing(thoughtProcessId: string, completedActionId: string): Promise<string>;
  abstract getAction(name: string): Action | undefined;
  abstract attachThoughtProcess(thoughtProcess: Database['public']['Tables']['thought_processes']['Row']): void;
}

type ThinkerConstructor = new () => Thinker;

// eslint-disable-next-line unicorn/no-static-only-class
export class Think {
  static async processSignals(subsystems: Record<string, ThinkerConstructor>, signals: any[]): Promise<string[]> {
    const thoughtProcessIds: string[] = [];

    for (const signal of signals) {
      logger.debug(`Processing signal ${signal.id}`);

      if (!Object.keys(subsystems).includes(signal.subsystem)) {
        throw new Error(`Invalid subsystem: ${signal.subsystem}`);
      }

      if (signal.from_action_id) {
        const actionRes = await sql`select * from thought_process_actions where id = ${signal.from_action_id}`;
        const action = actionRes[0];
        const parentThoughtProcessRes =
          await sql`select parent_thought_process_id from thought_processes where id = ${action.thought_process_id}`;
        const parentThoughtProcessId = parentThoughtProcessRes[0].parent_thought_process_id;

        if (!parentThoughtProcessId) {
          // this is a parent
          // check if existing child thought process for subsystem
          const existingChildRes = await sql`
            select id from thought_processes
            where parent_thought_process_id = ${action.thought_process_id}
            and subsystem = ${signal.subsystem}
          `;
          const existingChild = existingChildRes[0];

          if (existingChild) {
            // check if child has an active, non-responded-to message to origin subsystem
            const existingChildMessageRes = await sql`
              select signals.* from signals
              left join thought_process_actions on signals.from_action_id = thought_process_actions.id
              left join thought_processes on thought_process_actions.thought_process_id = thought_processes.id
              where thought_process_actions.thought_process_id = ${existingChild.id}
              and thought_processes.terminated_at is null
              and signals.from_subsystem = ${signal.subsystem}
              and signals.subsystem = ${signal.from_subsystem}
              and signals.id not in (
                select response_to from signals where response_to is not null
              )
            `;
            const existingChildMessage = existingChildMessageRes[0];

            if (existingChildMessage) {
              // set response_to to existing child message
              await sql`update signals set response_to = ${existingChildMessage.id} where id = ${signal.id}`;
              continue;
            }
          }
        } else {
          // this is a child
          // check if parent has an active, non-reponded-to message to origin subsystem
          const parentMessageRes = await sql`
            select signals.* from signals
            left join thought_process_actions on signals.from_action_id = thought_process_actions.id
            where thought_process_actions.thought_process_id = ${parentThoughtProcessId}
            and signals.from_subsystem = ${signal.subsystem}
            and signals.subsystem = ${signal.from_subsystem}
            and signals.id not in (
              select response_to from signals where response_to is not null
            )
          `;
          const parentMessage = parentMessageRes[0];

          if (parentMessage) {
            // set response_to to existing parent message
            await sql`update signals set response_to = ${parentMessage.id} where id = ${signal.id}`;
            continue;
          }
        }
      }

      const subsystem = subsystems[signal.subsystem as keyof typeof subsystems];

      try {
        const subsystemInstance = new subsystem();
        const thoughtProcessId = await subsystemInstance.processSignal(signal as SubsystemMessage);
        await this.acknowledgeSignal(signal.id);

        thoughtProcessIds.push(thoughtProcessId);

        logger.debug(`Processed signal ${signal.id} with thought process ${thoughtProcessId}`);
      } catch (error) {
        const exception = error as Error;
        logger.error(`Error processing signal ${signal.id}: ${exception.message}\n${exception.stack}`);
      }
    }

    return thoughtProcessIds;
  }

  static async processActions(subsystems: Record<string, ThinkerConstructor>, actions: any[]) {
    for (const processAction of actions) {
      logger.debug(`Processing thought process action ${processAction.id}`);

      const thoughtProcessRes =
        await sql`select * from thought_processes where id = ${processAction.thought_process_id}`;
      const thoughtProcess = thoughtProcessRes[0];

      if (!Object.keys(subsystems).includes(thoughtProcess.subsystem)) {
        throw new Error(`Invalid subsystem: ${thoughtProcess.subsystem}`);
      }

      const subsystem = subsystems[thoughtProcess.subsystem as keyof typeof subsystems];
      const subsystemInstance = new subsystem();
      subsystemInstance.attachThoughtProcess(
        thoughtProcess as Database['public']['Tables']['thought_processes']['Row']
      );

      const action = subsystemInstance.getAction(processAction.action);

      if (!action) {
        logger.error(`Invalid action: ${processAction.action}`);
        await sql`update thought_process_actions set status = 'failed' where id = ${processAction.id}`;
        continue;
      }

      const actionResult = await action.execute(processAction.id, processAction.parameters, processAction.data);

      if (actionResult.status === 'failed') {
        logger.error(`Action failed: ${processAction.action}`);
        await sql`update thought_process_actions set status = 'failed' where id = ${processAction.id}`;
        continue;
      }

      if (actionResult.status === 'complete') {
        logger.debug(`Action result: ${JSON.stringify(actionResult)} ${actionResult.status}`);
        const result = await action.result(
          processAction.thought_process_id,
          processAction.parameters,
          actionResult.data
        );
        await sql`update thought_process_actions set result = ${result} where id = ${processAction.id}`;

        try {
          await subsystemInstance.continueProcessing(processAction.thought_process_id, processAction.id);
        } catch (error) {
          const exception = error as Error;
          logger.error(`Failed to continue processing: ${exception.message}\n${exception.stack}`);
        }
      }

      await sql`update thought_process_actions set status = ${actionResult.status}, data = ${actionResult.data} where id = ${processAction.id}`;
    }
  }

  static async acknowledgeSignal(signalId: string) {
    await sql`update signals set acknowledged_at = now() where id = ${signalId}`;
  }
}

const ACTION_INSTRUCTIONS = `You have access to several actions to gather information and execute instructions:
{actions}

Based on the input, think about the next action to take. For example:

{ "thought": "I need to do X", "action": "action name here", "parameters": {} }

"parameters" must be a JSON object conforming to the action's Parameters JSON Schema.

You can only perform the actions you have have been given. You must only respond in this thought/action format.

Set "action" to null if the thought chain is complete (no further action needed)`;

export abstract class LLMSubsystem extends Think {
  abstract actions: ActionConstructor[];
  abstract agentPurpose: string;

  abstract instructions(): Promise<string[]>;

  model: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-0613' = 'gpt-3.5-turbo';
  temperature = 0.4;

  protected thoughtProcess!: Database['public']['Tables']['thought_processes']['Row'] & { data: any };

  get name() {
    return typeof this.constructor.name === 'string' ? this.constructor.name : 'Unknown';
  }

  getAction(name: string) {
    this.assertThoughtProcess();

    const foundAction = this.actions.find(action => action.name === name);
    if (foundAction) {
      return new foundAction(this.thoughtProcess);
    }
  }

  async availableActions() {
    this.assertThoughtProcess();

    if (!this.thoughtProcess) {
      throw new Error('No thought process');
    }

    // call async isAvailable for all actions
    const availableActions = await Promise.all(
      this.actions.map(async action => {
        const initializedAction = new action(this.thoughtProcess);
        const isAvailable = await initializedAction.isAvailable();
        return isAvailable ? initializedAction : null;
      })
    );

    return Object.fromEntries(
      availableActions.filter(action => action !== null).map(action => [action!.name, action!])
    );
  }

  async createSignal(worldId: string, payload: SignalActionPayload): Promise<SubsystemMessage> {
    const signals = await sql`insert into signals ${sql({
      world_id: worldId,
      subsystem: this.name,
      payload,
    })} returning *`;

    return signals[0] as SubsystemMessage;
  }

  async createThoughtProcess(message: SubsystemMessage, parentThoughtProcessId: string | null = null): Promise<string> {
    const thoughtProcessRes = await sql`insert into thought_processes ${sql({
      world_id: message.world_id,
      initiating_message_id: message.id,
      parent_thought_process_id: parentThoughtProcessId,
      subsystem: this.name,
    })} returning id`;

    return thoughtProcessRes[0].id;
  }

  attachThoughtProcess(thoughtProcess: Database['public']['Tables']['thought_processes']['Row']) {
    this.thoughtProcess = thoughtProcess;
  }

  assertThoughtProcess() {
    if (!this.thoughtProcess) {
      throw new Error('No thought process attached to thinker');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async prepareThoughtProcess(_thoughtProcessId: string, _message: SubsystemMessage): Promise<void> {}

  async processSignal(message: SubsystemMessage): Promise<string> {
    const messages = [
      { role: 'user', content: `${message.from_subsystem ?? 'Signal'}: ${JSON.stringify(message.payload)}` },
    ];

    let parentThoughtProcessId: string | null = null;

    if (message.from_action_id) {
      const actionRes = await sql`select * from thought_process_actions where id = ${message.from_action_id}`;
      const action = actionRes[0];
      parentThoughtProcessId = action.thought_process_id;
    }

    const thoughtProcessId = await this.createThoughtProcess(message, parentThoughtProcessId);

    await this.prepareThoughtProcess(thoughtProcessId, message);

    const thoughtProcessRes = await sql`select * from thought_processes where id = ${thoughtProcessId}`;
    this.thoughtProcess = thoughtProcessRes[0] as typeof this.thoughtProcess;

    const response = await this.processMessages(messages);

    messages.push(response);

    await this.saveMessages(thoughtProcessId, messages);

    return thoughtProcessId;
  }

  async processSignalWithExistingThoughtProcess(thoughtProcessId: string, message: SubsystemMessage): Promise<string> {
    const messages = [
      { role: 'user', content: `${message.from_subsystem ?? 'Signal'}: ${JSON.stringify(message.payload)}` },
    ];

    const thoughtProcessRes = await sql`select * from thought_processes where id = ${thoughtProcessId}`;
    this.thoughtProcess = thoughtProcessRes[0] as typeof this.thoughtProcess;

    const response = await this.processMessages(messages);

    messages.push(response);

    await this.saveMessages(thoughtProcessId, messages);

    return thoughtProcessId;
  }

  async continueProcessing(thoughtProcessId: string, completedActionId: string) {
    const previousMessages = await this.getMessages(thoughtProcessId);

    const actionRes = await sql`select * from thought_process_actions where id = ${completedActionId}`;
    const completedAction = actionRes[0];

    const messages = [{ role: 'user', content: completedAction.result }];

    const thoughtProcessRes = await sql`select * from thought_processes where id = ${thoughtProcessId}`;
    this.thoughtProcess = thoughtProcessRes[0] as typeof this.thoughtProcess;

    const response = await this.processMessages([...previousMessages, ...messages]);

    messages.push(response);

    await this.saveMessages(thoughtProcessId, messages);

    return thoughtProcessId;
  }

  async processMessages(messages: { role: string; content: string }[]) {
    let attemptsLeft = 3;
    const debugMessages: { role: string; content: string }[] = [];
    let response: { role: string; content: string } = { role: 'system', content: 'No response' };

    if (!this.thoughtProcess) {
      throw new Error('No thought process');
    }

    const baseMessage = await this.generateBaseMessage();

    while (attemptsLeft > 0) {
      response = await rawMessage(
        this.model,
        [baseMessage, ...messages, ...debugMessages, { role: 'system', content: 'Respond in pure JSON only' }],
        400,
        this.temperature
      );
      logger.debug(response.content);

      const actionCommand = JSON.parse(response.content) as ActionCommand;

      if (!actionCommand.thought) {
        logger.debug('No thought, invalid response');

        debugMessages.push(response, {
          role: 'system',
          content: 'No thought detected. Follow instructions and try again.',
        });

        attemptsLeft -= 1;
        continue;
      }

      if (!actionCommand.action || actionCommand.action === 'null') {
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

      await action.queue(actionCommand.parameters);

      break;
    }

    return response;
  }

  private async generateBaseMessage() {
    const instructions = await this.instructions();
    const actionsInstruction = ACTION_INSTRUCTIONS.replace(
      '{actions}',
      Object.values(await this.availableActions())
        .map(action => action.serializeDefinition())
        .join('\n')
    );
    const prompt = `${this.agentPurpose}\n\n${instructions.map(i => '- ' + i).join('\n')}\n\n${actionsInstruction}`;

    return { role: 'system', content: prompt };
  }

  private async saveMessages(thoughtProcessId: string, messages: { role: string; content: string }[]) {
    await sql`insert into thought_process_messages ${sql(
      messages.map(message => ({
        thought_process_id: thoughtProcessId,
        role: message.role,
        content: message.content,
      }))
    )}`;
  }

  private async getMessages(thoughtProcessId: string) {
    const messagesRes =
      await sql`select * from thought_process_messages where thought_process_id = ${thoughtProcessId}`;
    return messagesRes.map(message => ({ role: message.role, content: message.content }));
  }
}

export abstract class DeterministicSubsystem extends Think {
  abstract name: string;
  abstract actions: Action[];

  getAction(name: string) {
    return this.actions.find(action => action.name === name);
  }

  attachThoughtProcess(_thoughtProcess: Database['public']['Tables']['thought_processes']['Row']) {
    return;
  }

  async processSignal(message: SubsystemMessage) {
    let parentThoughtProcessId: string | null = null;

    if (message.from_action_id) {
      const actionRes = await sql`select * from thought_process_actions where id = ${message.from_action_id}`;
      const action = actionRes[0];
      parentThoughtProcessId = action.thought_process_id;
    }

    const thoughtProcessRes = await sql`insert into thought_processes ${sql({
      world_id: message.world_id,
      initiating_message_id: message.id,
      parent_thought_process_id: parentThoughtProcessId,
      subsystem: this.name,
    })} returning id`;

    const thoughtProcessId = thoughtProcessRes[0].id;
    const actionCommand = JSON.parse(message.payload) as ActionCommand;

    if (!actionCommand.action) {
      logger.debug('No action, returning');
      return thoughtProcessId;
    }

    const action = this.getAction(actionCommand.action);

    if (!action) {
      logger.warn(`Invalid action: ${actionCommand.action}`);

      return thoughtProcessId;
    }

    await action.queue(actionCommand);

    return thoughtProcessId;
  }

  async continueProcessing(thoughtProcessId: string, completedActionId: string) {
    const thoughtProcessRes = await sql`select * from thought_processes where id = ${thoughtProcessId}`;
    const thoughtProcess = thoughtProcessRes[0];

    const initiatingSignalRes = await sql`select * from signals where id = ${thoughtProcess.initiating_message_id}`;
    const initiatingSignal = initiatingSignalRes[0];

    const actionRes = await sql`select * from thought_process_actions where id = ${completedActionId}`;
    const completedAction = actionRes[0];

    const result = completedAction.result;

    await sql`insert into signals ${sql({
      world_id: thoughtProcess.world_id,
      type: 'signal',
      response_to: initiatingSignal.id,
      subsystem: initiatingSignal.from_subsystem ?? this.name,
      from_subsystem: this.name,
      payload: initiatingSignal.from_subsystem ? result : JSON.parse(result),
    })}`;

    return thoughtProcessId;
  }
}
