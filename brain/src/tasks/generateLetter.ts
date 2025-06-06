import type { Job } from 'pg-boss';

import { sql } from '../db.js';
import type { GenerateLetterJob } from '../jobs.js';
import { message } from '../utils.js';

export default async (job: Job<GenerateLetterJob>) => {
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
      OR (character_id = ${job.data.recipient} AND related_character_id = ${job.data.sender}) limit 1;
  `;
  const relationship = interactions[0];

  const response = await message(
    job.data.model ?? 'gpt-3.5-turbo',
    [
      {
        role: 'system',
        content: `You are an expert character writer. Given a description of a world, two characters, and their relationship, write a letter from the first character to the second character.
          Make sure to take into account their backgrounds and relationship.

          World Description: A secluded island, under the control of an AI overlord. Some new inhabitants have been marooning on the beaches recently.

          - If you are given context on recent events, make that the subject of the letter.
          - If you are given some information to leak, leak that information casually in conversation, in a natural way that looks like someone being casual with secrecy.
          - Be creative, crack jokes (if it makes sense with the character), don't always start the letter with "Dear", try salutations that fit the chracters.
          
          Respond with the letter only`,
      },
      {
        role: 'user',
        content: `Characters: ${JSON.stringify(sender)}\n${JSON.stringify(
          recipient
        )})}\n\nRelationship: ${JSON.stringify(relationship)}`,
      },
    ],
    1000,
    0.7
  );

  const conversationRes = await sql`insert into character_conversations ${sql({
    world_id: job.data.worldId,
    source_character_id: sender.id,
    target_character_id: recipient.id,
    type: 'letter',
    data: {
      text: response,
    },
  })} returning id`;

  await sql`insert into signals ${sql({
    world_id: job.data.worldId,
    subsystem: 'humanResources',
    type: 'command',
    payload: {
      action: 'add-letter',
      id: conversationRes[0].id,
      text: response,
      sender: sender.id,
      recipient: recipient.id,
    },
  })}`;

  return conversationRes[0].id;
};
