import { Job } from 'pg-boss';

import { sql } from '../db';
import logger from '../logging';

// Send a special signal to the Overlord denoting the passage of time
// this is meant to allow the AI to take actions toward its goal, even when not
// directly responding to player or world events
export default async (job: Job) => {
  logger.debug(`Sending passage of time signal to Overlord, ${job.id}`);

  await sql`insert into messages ${sql({
    type: 'signal',
    direction: 'in',
    subsystem: 'overlord',
    payload: { time: new Date() },
  })}`;
};
