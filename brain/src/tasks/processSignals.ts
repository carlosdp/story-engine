import { boss, sql } from '../db';
import logger from '../logging';
import subsystems from '../subsystems';
import { Subsystem } from '../subsystems/base';

export default async () => {
  logger.debug('Checking for signals');

  const signals =
    await sql`select signals.* from signals inner join worlds on signals.world_id = worlds.id where direction = 'in' and acknowledged_at is null and response_to is null and worlds.active = true`;

  await Subsystem.processSignals(subsystems, signals);

  if (signals.length > 0) {
    await boss.send('processActions', {});
  }
};
