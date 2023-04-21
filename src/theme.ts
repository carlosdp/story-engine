import { extendTheme, withDefaultColorScheme } from '@chakra-ui/react';

export const theme = extendTheme(
  {
    config: {
      initialColorMode: 'dark',
    },
  },
  withDefaultColorScheme({ colorScheme: 'red' })
);
