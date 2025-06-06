import { Job } from 'pg-boss';

import { sql } from '../db.js';
import logger from '../logging.js';

// Checks if active research is completed, and informs the Overlord
// so it can choose a new research target.
export default async (job: Job) => {
  logger.debug(`Checking for completed research, ${job.id}`);

  const completedResearchRes =
    await sql`select id, description from available_researchables where active = true and id in (select c.id from completed_researchables c)`;

  if (completedResearchRes.count > 0) {
    logger.debug('Found completed research');

    const completedResearch = completedResearchRes[0];

    await sql`insert into signals ${sql({
      world_id: completedResearch.world_id,
      type: 'signal',
      subsystem: 'overlord',
      payload: { message: `Research on "${completedResearch.description}" completed. Choose new research` },
    })}`;
  }
};
