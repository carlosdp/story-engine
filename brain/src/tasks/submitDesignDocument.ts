import { Job } from 'pg-boss';

import { sql } from '../db.js';
import { SubmitDesignDocumentJob } from '../jobs.js';
import logger from '../logging.js';

export default async (job: Job<SubmitDesignDocumentJob>) => {
  const documentRes = await sql`select * from design_documents where id = ${job.data.designDocumentId}`;
  const document = documentRes[0];
};
