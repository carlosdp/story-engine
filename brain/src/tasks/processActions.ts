import { Job } from 'pg-boss';

import { boss, sql } from '../db.js';
import logger from '../logging.js';
import { Think } from '../subsystems/base.js';
import subsystems from '../subsystems/index.js';

export default async (job: Job) => {
  logger.debug(`Checking for actions, ${job.id}`);

  const processActions =
    await sql`select * from thought_process_actions where status = 'waiting' or status = 'pending'`;

  await Think.processActions(subsystems, processActions);

  if (processActions.length > 0) {
    await boss.send('processSignals', {}, { singletonKey: 'processSignals' });
    await boss.send('processActions', {}, { singletonKey: 'processActions' });
  }
};
