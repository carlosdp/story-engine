import { Job } from 'pg-boss';

import { sql } from '../db';
import { StartCharacterJob } from '../jobs';
import { Think } from '../subsystems/base';
import { Storyteller } from '../subsystems/storyteller';

export default async (job: Job<StartCharacterJob>) => {
  const characters = await sql`select * from characters where id = ${job.data.playerCharacterId}`;
  const character = characters[0];

  if (!character) {
    throw new Error(`Character with id ${job.data.playerCharacterId} not found`);
  }

  // create starter mission
  const storyteller = new Storyteller();
  const signal = await storyteller.createSignal(job.data.worldId, {
    command: job.data.prompt,
    allocatedCharacters: [{ id: character.id, name: character.name, description: character.description }],
  });
  await Think.acknowledgeSignal(signal.id);

  const thoughtProcessId = await storyteller.createThoughtProcess(signal);

  const storylinesRes = await sql`insert into storylines ${sql({
    world_id: job.data.worldId,
    storyteller_id: thoughtProcessId,
    prompt: job.data.prompt,
  })} returning id`;
  const storylineId = storylinesRes[0].id;

  // associate player character with storyline
  await sql`insert into storyline_characters ${sql({
    storyline_id: storylineId,
    character_id: job.data.playerCharacterId,
  })}`;

  // start processing
  await storyteller.processSignalWithExistingThoughtProcess(thoughtProcessId, signal);
};
