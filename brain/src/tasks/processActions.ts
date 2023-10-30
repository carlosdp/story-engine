import { Job } from 'pg-boss';

import { boss, sql } from '../db.js';
import logger from '../logging.js';
import { Think } from '../subsystems/base.js';
import subsystems from '../subsystems/index.js';

export default async (job: Job) => {
  logger.debug(`Checking for actions, ${job.id}`);

  const processActions =
    await sql`select tpa.* from thought_process_actions tpa left join thought_processes tp on tp.id = tpa.thought_process_id where tp.terminated_at is null and (tpa.status = 'waiting' or tpa.status = 'pending')`;

  await Think.processActions(subsystems, processActions);

  if (processActions.length > 0) {
    await boss.send('processSignals', {}, { singletonKey: 'processSignals' });
    await boss.send('processActions', {}, { singletonKey: 'processActions' });
  }
};
