// theme/tokens.js
//
// Evolved design tokens for the dashboard, mirroring beworking-booking.
// Phase 1 of the dashboard unification — components consume these via
// `import { tokens } from '@/theme/tokens'` (or relative path).
//
// Mode-aware colors: use `getColors('light' | 'dark')` for dark-aware
// surfaces. The flat `colors` export is the light variant, kept for
// the most common case.

const BRAND = '#009624';
const BRAND_DEEP = '#007a1d';
const BRAND_SOFT = '#e6f4e9';

const lightColors = {
  brand: BRAND,
  brandDeep: BRAND_DEEP,
  brandSoft: BRAND_SOFT,

  bg: '#ffffff',
  bgSoft: '#f5f5f7',
  bgFaint: '#fbfbfd',
  bgInk: '#1d1d1f',

  ink: '#1d1d1f',
  ink2: '#424245',
  ink3: '#6e6e73',

  line: 'rgba(0, 0, 0, 0.08)',
  lineSoft: 'rgba(0, 0, 0, 0.04)',
};

const darkColors = {
  brand: BRAND,
  brandDeep: BRAND_DEEP,
  brandSoft: 'rgba(0, 150, 36, 0.18)',

  bg: '#1e1e1e',
  bgSoft: '#27272a',
  bgFaint: '#18181b',
  bgInk: '#fafafa',

  ink: '#e5e5e5',
  ink2: '#a1a1aa',
  ink3: '#71717a',

  line: 'rgba(255, 255, 255, 0.10)',
  lineSoft: 'rgba(255, 255, 255, 0.06)',
};

export const getColors = (mode = 'light') => (mode === 'dark' ? darkColors : lightColors);

export const colors = lightColors;

export const radius = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 28,
  xxl: 36,
  pill: 999,
};

export const shadow = {
  tile: '0 30px 80px -30px rgba(0, 0, 0, 0.18)',
  tileHover: '0 36px 90px -28px rgba(0, 0, 0, 0.22)',
  hero: '0 50px 120px -40px rgba(0, 0, 0, 0.25)',
  frame: '0 28px 60px -28px rgba(0, 0, 0, 0.20)',
  frameLift: '0 38px 80px -32px rgba(0, 0, 0, 0.26)',
};

export const motion = {
  durationFast: '0.2s',
  duration: '0.35s',
  durationSlow: '0.7s',
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  revealOffset: 20,
};

export const typography = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFeatureSettings: '"ss01", "cv11"',
  h1: {
    fontSize: { xs: '2.75rem', sm: '3.5rem', md: '4.5rem', lg: '5.5rem' },
    fontWeight: 600,
    letterSpacing: '-0.035em',
    lineHeight: 1.05,
  },
  h2: {
    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
    fontWeight: 600,
    letterSpacing: '-0.025em',
    lineHeight: 1.1,
  },
  h3: {
    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
    fontWeight: 600,
    letterSpacing: '-0.015em',
    lineHeight: 1.2,
  },
  eyebrow: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    letterSpacing: '0.02em',
    color: BRAND,
  },
  body: { fontSize: '1rem', lineHeight: 1.55, color: '#424245' },
  bodyLg: { fontSize: '1.125rem', lineHeight: 1.55, color: '#424245' },
};

export const layout = {
  maxWidth: 1200,
};

export const tokens = { colors, radius, shadow, motion, typography, layout };

export const getTokens = (mode = 'light') => ({
  colors: getColors(mode),
  radius,
  shadow,
  motion,
  typography,
  layout,
});

export default tokens;
