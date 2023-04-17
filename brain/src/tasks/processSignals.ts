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

    const subsystem = subsystems[signal.subsystem as keyof typeof subsystems];

    const thoughtProcessId = await subsystem.processSignal(signal as SubsystemMessage);

    await sql`update messages set acknowledged_at = now() where id = ${signal.id}`;

    logger.info(`Processed signal ${signal.id} with thought process ${thoughtProcessId}`);
  }
};
