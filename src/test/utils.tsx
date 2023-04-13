/* eslint-disable import/export */
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach } from 'vitest';

import { theme } from '../theme';

afterEach(() => {
  cleanup();
});

const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, {
    // wrap provider(s) here if needed
    wrapper: ({ children }) => {
      return (
        <ChakraProvider theme={theme}>
          <MemoryRouter>{children}</MemoryRouter>
        </ChakraProvider>
      );
    },
    ...options,
  });

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
// override render export
export { customRender as render };
