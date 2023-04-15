import axios from 'axios';
import axiosRetry from 'axios-retry';
import type { Job } from 'pg-boss';

import { boss, sql } from './db';
import type { GenerateCharactersJob } from './jobs';

const AVG_NUMBER_OF_RELATIONSHIPS = 3;

const message = async (
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature?: number
) => {
  const client = axios.create({ baseURL: 'https://api.openai.com/v1' });
  axiosRetry(client, {
    retries: 5,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: error => axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429,
  });

  try {
    const res = await client.post(
      '/chat/completions',
      {
        model,
        messages,
        temperature: temperature || 0,
        max_tokens: maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    if (res.status !== 200) {
      throw new Error(`OpenAI API error: ${res.statusText}`);
    }

    return res.data.choices[0].message.content.trim();
  } catch (error) {
    // @ts-ignore
    console.error(JSON.stringify(error.response?.data));
    throw error;
  }
};

console.log('Brain booting up...');

boss.start();

boss.work('generate-characters', async (job: Job<GenerateCharactersJob>) => {
  console.log('generate-characters job', job);

  for (let i = 0; i < job.data.count; i++) {
    const response = await message(
      job.data.model ?? 'gpt-3.5-turbo',
      [
        {
          role: 'system',
          content: `You are an expert character designer for a video game.

      Game Description: A survival game where hundreds of players play against an AI overlord that commands an army of bandits, army scientists, and drones on an island.
      
      When the user gives you the type of character they need, respond with a character definition with these JSON fields:
      title: Mr or Mrs or Dr, etc. can also be null
      first_name: the character's first name
      last_name: their last name
      backstory: a backstory for the character, how did they come into this position? did they go to school somewhere? what are they proud of? do they have a family? what are their hobbies and interests?
      personality: are they abrasive? comical? serious? shy? etc.
      writing_style: complete sentences? very casual? shortened sentences? mis-spellings?
      
      Be creative with the characters. Sometimes humans come from very different backgrounds than their job description entails.`,
        },
        { role: 'user', content: job.data.prompt },
        { role: 'system', content: 'Respond in pure JSON only' },
      ],
      1000,
      0.7
    );

    console.log(response);
    const character = JSON.parse(response);
    await sql`
      INSERT INTO characters (title, first_name, last_name, backstory, personality, writing_style, rust_npc_type)
      VALUES (${character.title}, ${character.first_name}, ${character.last_name}, ${character.backstory}, ${character.personality}, ${character.writing_style}, ${job.data.rustNpcType})
    `;
  }

  console.log(`Calculating target number of relationships, k=${AVG_NUMBER_OF_RELATIONSHIPS}...`);

  const currentNumberOfCharactersRes = await sql`
    SELECT COUNT(*) FROM characters where rust_npc_type = ${job.data.rustNpcType}
  `;

  const currentNumberOfCharacters = Number.parseInt(currentNumberOfCharactersRes[0].count);

  const targetNumberOfRelationships = Math.floor((currentNumberOfCharacters * AVG_NUMBER_OF_RELATIONSHIPS) / 2);

  const currentNumberOfRelationshipsRes = await sql`
    SELECT COUNT(*) FROM (
      SELECT DISTINCT
        cr.character_id,
        cr.related_character_id
      FROM
        character_relationships cr
        INNER JOIN characters c1 ON cr.character_id = c1.id
        INNER JOIN characters c2 ON cr.related_character_id = c2.id
      WHERE
        c1.rust_npc_type = ${job.data.rustNpcType}
        AND c2.rust_npc_type = ${job.data.rustNpcType}
    ) AS distinct_relationships;
  `;

  const currentNumberOfRelationships = Number.parseInt(currentNumberOfRelationshipsRes[0].count);

  console.log(
    `Target number of relationships: ${targetNumberOfRelationships}, current: ${currentNumberOfRelationships}`
  );

  const numberOfRelationshipsToGenerate = targetNumberOfRelationships - currentNumberOfRelationships;

  if (numberOfRelationshipsToGenerate > 0) {
    console.log(`Generating ${numberOfRelationshipsToGenerate} relationships...`);

    for (let i = 0; i < numberOfRelationshipsToGenerate; i++) {
      const characterPairRes = await sql`
        WITH random_characters AS (
          SELECT * FROM characters
          WHERE rust_npc_type = ${job.data.rustNpcType}
          ORDER BY RANDOM()
          LIMIT 2
        ), character_1 AS (
          SELECT * FROM random_characters
          LIMIT 1
        ), character_2 AS (
          SELECT * FROM random_characters
          OFFSET 1
          LIMIT 1
        )
        SELECT * FROM character_1
        UNION ALL
        SELECT * FROM character_2
        WHERE NOT EXISTS (
          SELECT 1
          FROM character_relationships cr, character_1 c1
          WHERE (cr.character_id = c1.id AND cr.related_character_id = character_2.id)
             OR (cr.character_id = character_2.id AND cr.related_character_id = c1.id)
        );
      `;

      if (characterPairRes.length !== 2) {
        console.log('No more characters to pair up');
        break;
      }

      const characters = characterPairRes.map(row => ({
        title: row.title,
        first_name: row.first_name,
        last_name: row.last_name,
        backstory: row.backstory,
        personality: row.personality,
        writing_style: row.writing_style,
      }));

      const response = await message(
        'gpt-3.5-turbo',
        [
          {
            role: 'system',
            content: `You are an expert character designer for a video game.

        Game Description: A survival game where hundreds of players play against an AI overlord that commands an army of bandits, army scientists, and drones on an island.
        
        The user will give you two character profiles. Your job is to respond with a relationship profile that describes the likely relationship between the two characters, based on their profiles. Respond with the following JSON fields:
        relationship_type: one of "friend", "colleague", "family", "abrasive", or "none"
        description_of_interactions: describe what a typical interaction between these characters would look like. are they friendly to each other? do they talk a lot? do they write letters to each other? do they avoid each other?
        
        Sometimes surprise is good, so choosing for characters to have a relationship that is not immediately obvious from their profiles could be desirable.`,
          },
          { role: 'user', content: `${JSON.stringify(characters[0])}\n\n${JSON.stringify(characters[1])}` },
          { role: 'system', content: 'Respond in pure JSON only' },
        ],
        500,
        0.7
      );
      const relationship = JSON.parse(response);

      await sql`
        INSERT INTO character_relationships (character_id, related_character_id, relationship_type, description_of_interactions)
        VALUES (${characterPairRes[0].id}, ${characterPairRes[1].id}, ${relationship.relationship_type}, ${relationship.description_of_interactions})
      `;
    }

    console.log('Done');
  }
});

boss.on('error', error => console.error(error));

console.log('Brain running!');
