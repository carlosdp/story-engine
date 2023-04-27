import { Job } from 'pg-boss';

import { boss, sql } from '../db';
import logger from '../logging';
import subsystems from '../subsystems';

export default async (job: Job) => {
  logger.debug(`Checking for actions, ${job.id}`);

  const processActions =
    await sql`select * from thought_process_actions where status = 'waiting' or status = 'pending'`;

  for (const processAction of processActions) {
    logger.debug(`Processing thought process action ${processAction.id}`);

    const thoughtProcessRes = await sql`select * from thought_processes where id = ${processAction.thought_process_id}`;
    const thoughtProcess = thoughtProcessRes[0];

    if (!Object.keys(subsystems).includes(thoughtProcess.subsystem)) {
      throw new Error(`Invalid subsystem: ${thoughtProcess.subsystem}`);
    }

    const subsystem = subsystems[thoughtProcess.subsystem as keyof typeof subsystems];

    const action = subsystem.getAction(processAction.action);

    if (!action) {
      logger.error(`Invalid action: ${processAction.action}`);
      await sql`update thought_process_actions set status = 'failed' where id = ${processAction.id}`;
      continue;
    }

    logger.debug('Executing action');

    const actionResult = await action.execute(processAction.id, processAction.parameters, processAction.data);

    logger.debug(`Action result: ${JSON.stringify(actionResult)} ${actionResult.status}`);

    if (actionResult.status === 'failed') {
      logger.error(`Action failed: ${processAction.action}`);
      await sql`update thought_process_actions set status = 'failed' where id = ${processAction.id}`;
      continue;
    }

    await sql`update thought_process_actions set status = ${actionResult.status}, data = ${actionResult.data} where id = ${processAction.id}`;

    if (actionResult.status === 'complete') {
      const result = await action.result(processAction.thought_process_id, processAction.parameters, actionResult.data);
      await sql`update thought_process_actions set result = ${result} where id = ${processAction.id}`;

      await subsystem.continueProcessing(processAction.thought_process_id, processAction.id);
    }

    logger.info(`Processed action ${processAction.id}`);
  }

  if (processActions.length > 0) {
    await boss.send('processSignals', {});
    await boss.send('processActions', {});
  }
};
