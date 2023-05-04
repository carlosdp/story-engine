import type { Job } from 'pg-boss';

import { sql, boss } from '../db';

export default async (_job: Job) => {
  // select random character relationship
  const relationships = await sql`select * from character_relationships order by random() limit 20`;

  // for each relationship, generate dialogue
  for (const relationship of relationships) {
    const character1 = await sql`select * from characters where id = ${relationship.character_id}`;
    const character2 = await sql`select * from characters where id = ${relationship.related_character_id}`;
    const sender = Math.random() > 0.5 ? character1[0] : character2[0];
    const recipient = sender === character1[0] ? character2[0] : character1[0];

    await boss.send('generateDialogue', {
      sender: sender.id,
      recipient: recipient.id,
      worldId: sender.world_id,
    });
  }
};
