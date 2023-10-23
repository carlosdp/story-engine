import { Job } from 'pg-boss';

import { sql } from '../db.js';
import { CreateScenarioJob } from '../jobs.js';
import { Think } from '../subsystems/base.js';
import { Storyteller } from '../subsystems/storyteller.js';

export default async (job: Job<CreateScenarioJob>) => {
  const scenarios =
    await sql`select scenarios.*, worlds.name as "world_name", worlds.description as "world_description" from scenarios left join worlds on worlds.id = scenarios.world_id where scenarios.id = ${job.data.scenarioId} limit 1`;
  const scenario = scenarios[0];

  if (!scenario) {
    throw new Error(`Scenario with id ${job.data.scenarioId} not found`);
  }

  const storyPrompt = `Create a mission for the given scenario, set in the given world.\nWorld Name: ${scenario.world_name}\nWorld Description: ${scenario.world_description}\nScenario Name: ${scenario.name}\nScenario Description: ${scenario.description}`;

  // create starter mission
  const storyteller = new Storyteller();
  const signal = await storyteller.createSignal(scenario.world_id, {
    command: storyPrompt,
    scenarioId: job.data.scenarioId,
    // allocatedCharacters: [{ id: character.id, name: character.name, description: character.description }],
  });
  await Think.acknowledgeSignal(signal.id);

  const thoughtProcessId = await storyteller.createThoughtProcess(signal);

  const storylinesRes = await sql`insert into storylines ${sql({
    world_id: scenario.world_id,
    prompt: storyPrompt,
    scenario_id: job.data.scenarioId,
  })} returning id`;
  const storylineId = storylinesRes[0].id;

  await sql`update thought_processes set ${sql({
    data: { storylineId },
  })} where id = ${thoughtProcessId}`;

  // associate player character with storyline
  // await sql`insert into storyline_characters ${sql({
  //   storyline_id: storylineId,
  //   character_id: job.data.playerCharacterId,
  // })}`;

  // start processing
  await storyteller.processSignalWithExistingThoughtProcess(thoughtProcessId, signal);
};
