import { sql } from '../db';
import logger from '../logging';
import { SubsystemMessage } from '../signal';
import subsystems from '../subsystems';

export default async () => {
  logger.debug('Checking for signals');

  const signals =
    await sql`select * from messages where direction = 'in' and acknowledged_at is null and response_to is null`;

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
          // check if child has an active, non-reponded-to message to origin subsystem
          const existingChildMessageRes = await sql`
            select messages.* from messages left join thought_process_actions on messages.from_action_id = thought_process_actions.id where thought_process_actions.thought_process_id = ${existingChild.id} and messages.direction = 'in' and messages.response_to is null and messages.subsystem = ${signal.from_subsystem}
          `;
          const existingChildMessage = existingChildMessageRes[0];

          if (existingChildMessage) {
            const responseToChildMessageRes = await sql`
              select * from messages where response_to = ${existingChildMessage.id}
            `;

            if (responseToChildMessageRes.length === 0) {
              // set response_to to existing child message
              await sql`update messages set response_to = ${existingChildMessage.id} where id = ${signal.id}`;
              continue;
            }
          }
        }
      } else {
        // this is a child
        // check if parent has an active, non-reponded-to message to origin subsystem
        const parentMessageRes = await sql`
          select messages.* from messages left join thought_process_actions on messages.from_action_id = thought_process_actions.id where thought_process_actions.thought_process_id = ${parentThoughtProcessId} and messages.direction = 'in' and messages.response_to is null and messages.subsystem = ${signal.from_subsystem}
        `;
        logger.debug(JSON.stringify(parentMessageRes));
        const parentMessage = parentMessageRes[0];

        if (parentMessage) {
          const responseToParentMessageRes = await sql`
            select * from messages where response_to = ${parentMessage.id}
          `;

          if (responseToParentMessageRes.length === 0) {
            // set response_to to parent message
            await sql`update messages set response_to = ${parentMessage.id} where id = ${signal.id}`;
            continue;
          }
        }
      }
    }

    const subsystem = subsystems[signal.subsystem as keyof typeof subsystems];

    const thoughtProcessId = await subsystem.processSignal(signal as SubsystemMessage);

    await sql`update messages set acknowledged_at = now() where id = ${signal.id}`;

    logger.info(`Processed signal ${signal.id} with thought process ${thoughtProcessId}`);
  }
};
