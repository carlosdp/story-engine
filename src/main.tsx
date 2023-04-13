import { ChakraProvider, ColorModeScript, GlobalStyle } from '@chakra-ui/react';
import { SupabaseClient } from '@supabase/supabase-js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { SupabaseProvider } from './SupabaseProvider';
import { theme } from './theme';

const client = new SupabaseClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!);

ReactDOM.createRoot(document.querySelector('#root')!).render(
  <>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <GlobalStyle />
        <BrowserRouter>
          <SupabaseProvider client={client}>
            <App />
          </SupabaseProvider>
        </BrowserRouter>
      </ChakraProvider>
    </React.StrictMode>
  </>
);
