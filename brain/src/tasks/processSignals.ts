import { boss, sql } from '../db.js';
import logger from '../logging.js';
import { Think } from '../subsystems/base.js';
import subsystems from '../subsystems/index.js';

export default async () => {
  logger.debug('Checking for signals');

  const signals =
    await sql`select signals.* from signals inner join worlds on signals.world_id = worlds.id where acknowledged_at is null and response_to is null and worlds.active = true`;

  await Think.processSignals(subsystems, signals);

  if (signals.length > 0) {
    await boss.send('processActions', {});
  }
};
