import { Job } from 'pg-boss';

import { sql } from '../db';
import { CreateCharacterJob } from '../jobs';
import { Storyteller } from '../subsystems/storyteller';

export default async (job: Job<CreateCharacterJob>) => {
  const stories = await sql`select * from stories where storylines.id = ${job.data.storylineId} limit 1`;
  const story = stories[0];

  if (!story) {
    throw new Error(`Story for Storyline ${job.data.storylineId} not found`);
  }

  const storyteller = new Storyteller();
  await storyteller.createSignal(story.world_id, {
    command:
      'Create an additional as part of the crew and add them to the story. Use the characterId provided when creating the character. You do not need to create a new story or mission.',
    storylineId: job.data.storylineId,
    story: story.story,
    characterId: job.data.characterId,
  });
};
