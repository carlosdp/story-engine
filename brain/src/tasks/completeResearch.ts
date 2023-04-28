import { Job } from 'pg-boss';

import { sql } from '../db';
import logger from '../logging';

// Checks if active research is completed, and informs the Overlord
// so it can choose a new research target.
export default async (job: Job) => {
  logger.debug(`Checking for completed reseach, ${job.id}`);

  const completedResearchRes =
    await sql`select id, description from active_researchables where active = true and id in (select c.id from completed_researchables c)`;

  if (completedResearchRes.count > 0) {
    logger.debug('Found completed research');

    const completedResearch = completedResearchRes[0];

    await sql`insert into messages ${sql({
      type: 'signal',
      direction: 'in',
      subsystem: 'overlord',
      payload: { message: `Research on "${completedResearch.description}" completed. Choose new research` },
    })}`;
  }
};
