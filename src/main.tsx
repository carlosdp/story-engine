import { ChakraProvider, ColorModeScript, GlobalStyle } from '@chakra-ui/react';
import { SupabaseClient } from '@supabase/supabase-js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { SupabaseProvider } from './SupabaseProvider';
import { Database } from './supabaseTypes';
import { theme } from './theme';

const client = new SupabaseClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
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
