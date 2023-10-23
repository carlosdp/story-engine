import { ChakraProvider, ColorModeScript, GlobalStyle } from '@chakra-ui/react';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/react';
import { SupabaseClient } from '@supabase/supabase-js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';

import App from './App.js';
import { SupabaseProvider } from './SupabaseProvider.js';
import { Database } from './supabaseTypes.js';
import { theme } from './theme.js';

if (import.meta.env.MODE === 'production') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1,
  });
}

const client = new SupabaseClient<Database>(
  import.meta.env.DEV ? `${window.location.origin}/supabase` : import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
const queryClient = new QueryClient();

ReactDOM.createRoot(document.querySelector('#root')!).render(
  <>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <GlobalStyle />
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <SupabaseProvider client={client}>
              <App />
            </SupabaseProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ChakraProvider>
    </React.StrictMode>
  </>
);
