import { Job } from 'pg-boss';

import { boss, sql } from '../db';
import logger from '../logging';
import subsystems from '../subsystems';
import { Subsystem } from '../subsystems/base';

export default async (job: Job) => {
  logger.debug(`Checking for actions, ${job.id}`);

  const processActions =
    await sql`select * from thought_process_actions where status = 'waiting' or status = 'pending'`;

  await Subsystem.processActions(subsystems, processActions);

  if (processActions.length > 0) {
    await boss.send('processSignals', {}, { singletonKey: 'processSignals' });
    await boss.send('processActions', {}, { singletonKey: 'processActions' });
  }
};
