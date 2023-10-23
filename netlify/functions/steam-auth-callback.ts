/* eslint-disable unicorn/filename-case */
import { HandlerEvent, HandlerContext, Handler } from '@netlify/functions';
import * as Sentry from '@sentry/serverless';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import SteamAuth from 'node-steam-openid';

import type { Database } from '../../src/supabaseTypes.js';

if (process.env.NODE_ENV === 'production') {
  Sentry.AWSLambda.init({
    dsn: process.env.FUNCTIONS_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1,
  });
}

const _handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const userId = event.queryStringParameters?.user_id;

  const client = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: user, error: userError } = await client.from('users').select().eq('id', userId).single();

  if (userError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: userError }),
    };
  }

  const steam = new SteamAuth({
    realm: process.env.URL!,
    returnUrl: `${process.env.URL}/.netlify/functions/steam-auth-callback`,
    apiKey: process.env.STEAM_API_KEY!,
  });

  const steamUser = await steam.authenticate(event.rawUrl as any);

  const newUserData: Database['public']['Tables']['profiles']['Update'] = {
    steam_id: steamUser.steamid,
  };

  try {
    const res = await axios.get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&format=json&steamid=${steamUser.steamid}`
    );

    const rustGame = res.data.response.games.find((game: any) => game.appid === 252_490);

    if (rustGame) {
      newUserData.owns_rust = true;
      newUserData.rust_played_minutes_total = rustGame.playtime_forever;
      newUserData.rust_played_minutes_recent = rustGame.playtime_2weeks;
    } else {
      newUserData.owns_rust = false;
    }
  } catch {
    // eslint-disable-next-line no-console
    console.log('Profile not public');
  }

  await client.from('profiles').update(newUserData).eq('user_id', user.id);

  if (process.env.DISCORD_GUILD_ID) {
    try {
      // use Discord API to add "Registered" role to user
      await axios.put(
        `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${user.discord_id}/roles/${process.env.DISCORD_REGISTERED_ROLE_ID}`,
        {},
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );
    } catch (error) {
      console.error(error.response.data);
    }
  }

  return {
    statusCode: 307,
    headers: {
      Location: process.env.URL!,
    },
  };
};

const handler = Sentry.AWSLambda.wrapHandler(_handler);

export { handler };
