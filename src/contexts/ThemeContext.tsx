import React, { createContext, useState, useCallback, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import type { Theme, PaletteMode } from '@mui/material';

export interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export default ThemeContext;


interface ThemeProviderProps {
  children: React.ReactNode;
}

export const CustomThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    // Get theme from localStorage or default to light
    try {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
    } catch {
      return 'light';
    }
  });

  const toggleTheme = useCallback(() => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newMode);
      return newMode;
    });
  }, []);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#1976d2' : '#90caf9',
            contrastText: '#ffffff',
          },
          secondary: {
            main: mode === 'light' ? '#dc004e' : '#f48fb1',
          },
          background: {
            default: mode === 'light' ? '#fafafa' : '#0a0a0a',
            paper: mode === 'light' ? '#ffffff' : '#1a1a1a',
          },
          text: {
            primary: mode === 'light' ? '#202124' : '#e8eaed',
            secondary: mode === 'light' ? '#5f6368' : '#9aa0a6',
          },
          divider: mode === 'light' ? '#dadce0' : '#3c4043',
        },
        typography: {
          fontFamily: '"Google Sans", "Roboto", "Arial", sans-serif',
          h3: {
            fontWeight: 400,
            fontSize: '2.5rem',
            lineHeight: 1.2,
          },
          h4: {
            fontWeight: 400,
            fontSize: '2rem',
            lineHeight: 1.3,
          },
          h5: {
            fontWeight: 500,
            fontSize: '1.5rem',
            lineHeight: 1.4,
          },
          h6: {
            fontWeight: 500,
            fontSize: '1.25rem',
            lineHeight: 1.4,
          },
          body1: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
          },
          body2: {
            fontSize: '0.75rem',
            lineHeight: 1.5,
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: 'none',
                border: `1px solid ${mode === 'light' ? '#e0e0e0' : '#424242'}`,
                borderRadius: 8,
                '&:hover': {
                  boxShadow: mode === 'light'
                    ? '0 2px 4px rgba(0,0,0,0.1)'
                    : '0 2px 4px rgba(255,255,255,0.1)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 4,
                fontSize: '0.875rem',
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
                },
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: 'none',
                borderBottom: `1px solid ${mode === 'light' ? '#dadce0' : '#3c4043'}`,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: mode === 'light' ? '#dadce0' : '#3c4043',
                  },
                  '&:hover fieldset': {
                    borderColor: mode === 'light' ? '#1976d2' : '#90caf9',
                  },
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  // Save theme preference
  useEffect(() => {
    try {
      localStorage.setItem('theme', mode);
    } catch (error) {
      console.warn('Could not save theme preference:', error);
    }
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};