import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false
};

export const theme = extendTheme(
  { config },
  {
    colors: {
      brand: {
        100: '#ffffff24'
      }
    },
    styles: {
      global: () => ({
        body: {
          bg: '#1f1424'
        }
      })
    }
  }
);
