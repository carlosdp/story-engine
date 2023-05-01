import { Job } from 'pg-boss';

import { sql } from '../db';
import { TimeSignalJob } from '../jobs';
import logger from '../logging';

// Send a special signal to the Overlord denoting the passage of time
// this is meant to allow the AI to take actions toward its goal, even when not
// directly responding to player or world events
export default async (job: Job<TimeSignalJob>) => {
  logger.debug(`Sending passage of time signal to Overlord, ${job.id}`);

  const worldIds = [];

  if (job.data.worldId) {
    worldIds.push(job.data.worldId);
  } else {
    const worlds = await sql`select id from worlds`;
    worlds.forEach(world => worldIds.push(world.id));
  }

  for (const worldId of worldIds) {
    await sql`insert into messages ${sql({
      world_id: worldId,
      type: 'signal',
      direction: 'in',
      subsystem: 'overlord',
      payload: { time: new Date() },
    })}`;
  }
};
