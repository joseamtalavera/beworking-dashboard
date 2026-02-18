/**
 * Unified MUI theme configuration for beworking dashboard.
 * Green primary buttons + editorial typography.
 * Supports light and dark modes.
 */

const BRAND = {
  green: '#009624',
  greenHover: '#007a1d',
  greenLight: '#2ecc71',
  greenSoft: 'rgba(0, 150, 36, 0.08)',
  greenSoftMedium: 'rgba(0, 150, 36, 0.12)',
  greenSoftSubtle: 'rgba(0, 150, 36, 0.06)',
};

export const getDesignTokens = (mode = 'light') => {
  const isLight = mode === 'light';

  return {
    palette: {
      mode,
      brand: {
        green: BRAND.green,
        greenHover: BRAND.greenHover,
        orange: BRAND.greenLight,
        orangeHover: '#27ae60',
        orangeSoft: BRAND.greenSoft,
        ink: isLight ? '#1a1a1a' : '#e5e5e5',
        inkLight: isLight ? '#2d2d2d' : '#d4d4d4',
        graphite: isLight ? '#4a4a4a' : '#a1a1aa',
        muted: isLight ? '#71717a' : '#a1a1aa',
        dark: isLight ? '#1a1a1a' : '#fafafa',
        lightBg: isLight ? '#fafafa' : '#18181b',
        warmWhite: isLight ? '#f8f8f6' : '#1a1a1a',
        border: isLight ? '#e5e5e5' : '#3f3f46',
        borderSoft: isLight ? '#eeeeee' : '#27272a',
        accentSoft: BRAND.greenSoftSubtle,
        accentMedium: BRAND.greenSoftMedium,
      },
      primary: {
        main: BRAND.green,
        light: BRAND.greenLight,
        dark: BRAND.greenHover,
        contrastText: '#ffffff',
      },
      secondary: {
        main: BRAND.greenLight,
        light: '#a3e4bc',
        dark: '#27ae60',
        contrastText: '#ffffff',
      },
      success: {
        main: BRAND.green,
        light: BRAND.greenLight,
        dark: BRAND.greenHover,
        contrastText: '#fff',
      },
      info: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#2563eb',
        contrastText: '#fff',
      },
      error: {
        main: '#dc2626',
        light: '#ef4444',
        dark: '#b91c1c',
        contrastText: '#fff',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
        contrastText: '#000',
      },
      background: {
        default: isLight ? '#fafafa' : '#121212',
        paper: isLight ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: isLight ? '#1a1a1a' : '#e5e5e5',
        secondary: isLight ? '#71717a' : '#a1a1aa',
        disabled: isLight ? '#a1a1aa' : '#52525b',
      },
      divider: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
      grey: {
        50: isLight ? '#fafafa' : '#18181b',
        100: isLight ? '#f5f5f5' : '#27272a',
        200: isLight ? '#e5e5e5' : '#3f3f46',
        300: isLight ? '#d4d4d4' : '#52525b',
        400: isLight ? '#a1a1aa' : '#71717a',
        500: isLight ? '#71717a' : '#a1a1aa',
        600: isLight ? '#52525b' : '#d4d4d4',
        700: isLight ? '#3f3f46' : '#e5e5e5',
        800: isLight ? '#27272a' : '#f5f5f5',
        900: isLight ? '#18181b' : '#fafafa',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 500,
            letterSpacing: '-0.01em',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            backgroundColor: BRAND.green,
            '&:hover': {
              backgroundColor: BRAND.greenHover,
            },
          },
          containedSecondary: {
            backgroundColor: BRAND.greenLight,
            '&:hover': {
              backgroundColor: '#27ae60',
            },
          },
          outlined: {
            '&:hover': {
              backgroundColor: BRAND.greenSoftSubtle,
            },
          },
          outlinedPrimary: {
            borderColor: BRAND.green,
            color: BRAND.green,
            '&:hover': {
              backgroundColor: BRAND.greenSoftSubtle,
              borderColor: BRAND.greenHover,
            },
          },
          text: {
            '&:hover': {
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: BRAND.green,
            '&:hover': {
              backgroundColor: BRAND.greenSoft,
            },
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: BRAND.green,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              '& fieldset': {
                borderColor: isLight ? '#e5e5e5' : '#3f3f46',
              },
              '&:hover fieldset': {
                borderColor: BRAND.green,
              },
              '&.Mui-focused fieldset': {
                borderColor: BRAND.green,
                borderWidth: 1,
              },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isLight ? '#e5e5e5' : '#3f3f46',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: BRAND.green,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: BRAND.green,
              borderWidth: 1,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: 'none',
            border: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.08)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: isLight ? '0 1px 3px rgba(0, 0, 0, 0.04)' : '0 1px 3px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
          },
          filled: {
            '&.MuiChip-colorDefault': {
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.08)',
              '&:hover': {
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)',
              },
            },
          },
          outlined: {
            borderColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
          },
          colorPrimary: {
            backgroundColor: 'rgba(0, 150, 36, 0.1)',
            color: isLight ? '#007a1d' : '#4ade80',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 600,
              color: isLight ? '#1a1a1a' : '#e5e5e5',
              backgroundColor: isLight ? '#fafafa' : '#1a1a1a',
              borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            '&.Mui-selected': {
              color: BRAND.green,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: BRAND.green,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&.Mui-selected': {
              backgroundColor: BRAND.greenSoft,
              '&:hover': {
                backgroundColor: BRAND.greenSoftMedium,
              },
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': {
              color: BRAND.green,
              '& + .MuiSwitch-track': {
                backgroundColor: BRAND.green,
              },
            },
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: isLight ? '#a1a1aa' : '#52525b',
            '&.Mui-checked': {
              color: BRAND.green,
            },
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            color: isLight ? '#a1a1aa' : '#52525b',
            '&.Mui-checked': {
              color: BRAND.green,
            },
          },
        },
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: {
        fontSize: 'clamp(2.5rem, 4.5vw, 3.75rem)',
        fontWeight: 500,
        lineHeight: 1.08,
        letterSpacing: '-0.035em',
      },
      h2: {
        fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
        fontWeight: 500,
        lineHeight: 1.12,
        letterSpacing: '-0.03em',
      },
      h3: {
        fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
        fontWeight: 500,
        lineHeight: 1.15,
        letterSpacing: '-0.025em',
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 500,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      },
      bodyLg: {
        fontSize: '1.125rem',
        fontWeight: 400,
        lineHeight: 1.6,
        letterSpacing: '-0.01em',
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.7,
        letterSpacing: '-0.01em',
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.6,
        letterSpacing: '-0.005em',
      },
      bodySm: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.5,
      },
      overline: {
        fontSize: '0.75rem',
        fontWeight: 500,
        lineHeight: 1.5,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      },
      nav: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '-0.01em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '0.875rem',
        letterSpacing: '-0.01em',
      },
    },
  };
};

export default getDesignTokens();
