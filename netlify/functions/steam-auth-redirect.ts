/* eslint-disable unicorn/filename-case */
import { HandlerEvent, HandlerContext, Handler } from '@netlify/functions';
import * as Sentry from '@sentry/serverless';
import { createClient } from '@supabase/supabase-js';
import SteamAuth from 'node-steam-openid';

import type { Database } from '../../src/supabaseTypes';

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
  const supabaseSession = event.headers['x-supabase-access-token'];

  const client = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const userRes = await client.auth.getUser(supabaseSession);

  const user = userRes.data.user;

  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const steam = new SteamAuth({
    realm: process.env.URL!,
    returnUrl: `${process.env.URL}/.netlify/functions/steam-auth-callback?user_id=${user.id}`,
    apiKey: process.env.STEAM_API_KEY!,
  });

  const redirectUrl = await steam.getRedirectUrl();

  return {
    statusCode: 200,
    body: JSON.stringify({ redirectUrl }),
  };
};

const handler = Sentry.AWSLambda.wrapHandler(_handler);

export { handler };
