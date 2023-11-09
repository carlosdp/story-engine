import { EntityBuilder } from '../subsystems/entityBuilder.js';

const subsystem = new EntityBuilder();
await subsystem.createSignal('6d2cb791-703c-4ea4-afbf-a605fbad68b0', {
  command: 'Create a new character for a player on the crew of the mining ship',
});

// eslint-disable-next-line
process.exit();
