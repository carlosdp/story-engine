import type { Job } from 'pg-boss';

import { sql } from '../db';
import type { GenerateLetterJob } from '../jobs';
import logger from '../logging';
import { message } from '../utils';

export default async (job: Job<GenerateLetterJob>) => {
  logger.debug('generate-letter job');
  try {
    const senderRes = await sql`
      select * from characters where id = ${job.data.sender}
    `;
    const recipientRes = await sql`
      select * from characters where id = ${job.data.recipient}
    `;
    const sender = senderRes[0];
    const recipient = recipientRes[0];
    if (!sender || !recipient) throw new Error('Invalid sender or recipient');

    const interactions = await sql`
      SELECT description_of_interactions, relationship_type
      FROM character_relationships
      WHERE (character_id = ${job.data.sender} AND related_character_id = ${job.data.recipient})
        OR (character_id = ${job.data.recipient} AND related_character_id = ${job.data.sender});
    `;

    const relationshipType = interactions[0] ? interactions[0].relationship_type : 'none';
    const priorInteractions = interactions[0] ? interactions[0].prior_interactions : 'none';

    const content = `
      Character A: ${JSON.stringify(sender)}
      Character B: ${JSON.stringify(recipient)}
      Relationship type: ${relationshipType}
      Past Interactions: ${priorInteractions}
      Letter subject: ${job.data.prompt}
      `;
    logger.debug('sending message', content);
    const response = await message(
      job.data.model ?? 'gpt-3.5-turbo',
      [
        {
          role: 'system',
          content: `You are an expert character designer for a video game.

        Game Description: A survival game where hundreds of players play against an AI overlord that commands an army of bandits, army scientists, and drones on an island.
     
        In the game, character A is writing a letter to character B.

        The letter's subject:  
        When the user gives you the letter they want you to write, respond with these fields:
        content: a one-page letter from character A to character B about the topic provided. 
        summary: a summary of the letter's content
      
      Be creative with the letter.`,
        },
        {
          role: 'user',
          content,
        },
        { role: 'system', content: 'Respond in pure JSON only' },
      ],
      1000,
      0.7
    );

    const letter = JSON.parse(response);
    logger.debug('message received:', letter.summary);
    await sql`
      insert into letters (world_id, summary, content, sender, recipient)
      values (${job.data.worldId}, ${letter.summary}, ${letter.content}, ${job.data.sender}, ${job.data.recipient})
    `;
    await sql`insert into messages ${sql({
      world_id: job.data.worldId,
      subsystem: 'humanResources',
      direction: 'out',
      type: 'command',
      payload: {
        response: 'add_letter',
        content: letter.content,
        sender: job.data.sender,
        recipient: job.data.recipient,
      },
    })}`;
  } catch (error) {
    logger.error(error);
  }
};
