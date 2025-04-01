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
        },
        '&::-webkit-scrollbar': {
          width: '10px',
          backgroundColor: '#1f1424'
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#1f1424'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#ffffff24',
          backgroundImage: '-webkit-linear-gradient(45deg, rgba(255, 255, 255, .2) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, .2) 50%, rgba(255, 255, 255, .2) 75%, transparent 75%, transparent)'
        }
      })
    }
  }
);
