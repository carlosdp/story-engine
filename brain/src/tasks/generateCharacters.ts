import type { Job } from 'pg-boss';

import { sql } from '../db';
import type { GenerateCharactersJob } from '../jobs';
import logger from '../logging';
import { embedding, message } from '../utils';

const AVG_NUMBER_OF_RELATIONSHIPS = 3;
const COUNTRIES = [
  'United States',
  'Canada',
  'Mexico',
  'United Kingdom',
  'France',
  'Germany',
  'Italy',
  'Spain',
  'Russia',
  'China',
  'Japan',
  'India',
  'Austria',
  'Sweden',
  'United Arab Emirates',
  'Brazil',
  'Australia',
  'Argentina',
  'Nigeria',
  'South Africa',
  'Egypt',
  'Saudi Arabia',
  'Iran',
  'Turkey',
  'Indonesia',
  'Pakistan',
  'Bangladesh',
  'Philippines',
  'Ukraine',
  'Thailand',
  'Vietnam',
  'Myanmar',
  'South Korea',
  'Afghanistan',
  'Morocco',
  'Colombia',
  'Algeria',
  'Sudan',
  'Uzbekistan',
  'Peru',
  'Angola',
  'Mali',
  'Mozambique',
  'Ghana',
  'Yemen',
  'Nepal',
  'Venezuela',
  'Madagascar',
  'Cameroon',
  'North Korea',
  'Australia',
  'Taiwan',
  'Sri Lanka',
  'Burkina Faso',
  'Malaysia',
  'Mauritania',
  'Chile',
  'Kazakhstan',
  'Zambia',
  'Guatemala',
  'Ecuador',
  'Netherlands',
  'Syria',
  'Senegal',
  'Cambodia',
  'Chad',
  'Somalia',
  'Zimbabwe',
  'Rwanda',
  'Guinea',
  'Benin',
  'Tunisia',
  'Bolivia',
  'Belgium',
  'Haiti',
  'Cuba',
  'South Sudan',
  'Dominican Republic',
  'Czech Republic',
  'Greece',
  'Portugal',
  'Jordan',
  'Azerbaijan',
  'Hungary',
  'Belarus',
  'Tajikistan',
];

function biasedRandomIndex(length: number, bias: number): number {
  const randomValue = Math.random() ** bias;
  return Math.floor(randomValue * length);
}

function getBiasedRandomString(strings: string[], bias = 2): string {
  if (strings.length === 0) {
    throw new Error('The input array should not be empty.');
  }
  const index = biasedRandomIndex(strings.length, bias);
  return strings[index];
}

export default async (job: Job<GenerateCharactersJob>) => {
  for (let i = 0; i < job.data.count; i++) {
    const randomCountry = getBiasedRandomString(COUNTRIES, 2);
    const randomGender = Math.random() > 0.5 ? 'Male' : 'Female';
    const response = await message(
      job.data.model ?? 'gpt-3.5-turbo',
      [
        {
          role: 'system',
          content: `You are an expert character designer for a video game.

      Game Description: A small town in Europe called Castor Town, that looks quaint and traditional, but is actually a hotspot for people working on the beginnings of a new space race.

      Character Origin: ${randomCountry}
      Character Gender: ${randomGender}
      
      When the user gives you the type of character they need, respond with a character definition with these JSON fields:
      name: the character's name
      short_description: a 2-3 sentence description of the character, concentrating on their profession and any major affiliations
      backstory: a backstory for the character, how did they come into this position? did they go to school somewhere? what are they proud of? do they have a family? what are their hobbies and interests?
      personality: are they abrasive? comical? serious? shy? etc.
      writing_style: complete sentences? very casual? shortened sentences? mis-spellings? uses slang? etc.
      
      Be creative with the characters. Sometimes humans come from very different backgrounds than their job description entails.`,
        },
        { role: 'user', content: job.data.prompt },
        { role: 'system', content: 'Respond in pure JSON only' },
      ],
      1000,
      0.7
    );

    const character = JSON.parse(response);

    const embed = await embedding(`${character.short_description} ${character.backstory}`);

    await sql`
      insert into characters (world_id, name, description, backstory, personality, writing_style, embedding)
      values (${job.data.worldId}, ${character.name}, ${character.short_description}, ${character.backstory}, ${
      character.personality
    }, ${character.writing_style}, ${JSON.stringify(embed)})
    `;
  }

  /*
  logger.info(`Calculating target number of relationships, k=${AVG_NUMBER_OF_RELATIONSHIPS}...`);

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

  logger.info(
    `Target number of relationships: ${targetNumberOfRelationships}, current: ${currentNumberOfRelationships}`
  );

  const numberOfRelationshipsToGenerate = targetNumberOfRelationships - currentNumberOfRelationships;

  if (numberOfRelationshipsToGenerate > 0) {
    logger.info(`Generating ${numberOfRelationshipsToGenerate} relationships...`);

    for (let i = 0; i < numberOfRelationshipsToGenerate; i++) {
      const characterPairRes = await sql`
        WITH unrelated_character_pairs AS (
          SELECT c1.id AS character_1_id, c2.id AS character_2_id
          FROM characters c1
          JOIN characters c2 ON c1.id < c2.id
          WHERE c1.rust_npc_type = ${job.data.rustNpcType}
            AND c2.rust_npc_type = ${job.data.rustNpcType}
            AND NOT EXISTS (
              SELECT 1
              FROM character_relationships cr
              WHERE (cr.character_id = c1.id AND cr.related_character_id = c2.id)
                 OR (cr.character_id = c2.id AND cr.related_character_id = c1.id)
            )
        ), random_unrelated_pair AS (
          SELECT *
          FROM unrelated_character_pairs
          ORDER BY RANDOM()
          LIMIT 1
        )
        SELECT c.*
        FROM characters c
        JOIN random_unrelated_pair rup
        ON c.id = rup.character_1_id OR c.id = rup.character_2_id;
      `;

      if (characterPairRes.length !== 2) {
        logger.info('No more characters to pair up');
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
          {
            role: 'user',
            content: `${JSON.stringify(characters[0])}\n\n${JSON.stringify(characters[1])}`,
          },
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

    logger.info('Done');
  }
  */
};
