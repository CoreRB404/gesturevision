export const colors = {
  bg: '#0a0a0f',
  bgCard: 'rgba(255,255,255,0.06)',
  bgCardSolid: '#14141f',
  bgGlass: 'rgba(255,255,255,0.08)',
  surface: '#1a1a2e',
  surfaceLight: '#25253d',
  primary: '#6c5ce7',
  primaryLight: '#a29bfe',
  secondary: '#00cec9',
  secondaryLight: '#81ecec',
  accent: '#fd79a8',
  accentLight: '#fab1c4',
  warning: '#ffeaa7',
  warningDark: '#fdcb6e',
  success: '#55efc4',
  successDark: '#00b894',
  error: '#ff7675',
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.35)',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.15)',
  gradientPrimary: ['#6c5ce7', '#a29bfe'],
  gradientSecondary: ['#00cec9', '#81ecec'],
  gradientAccent: ['#e17055', '#fd79a8'],
  gradientDark: ['#0a0a0f', '#1a1a2e'],
  gradientCard: ['rgba(108,92,231,0.15)', 'rgba(0,206,201,0.05)'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 42,
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
};

export const shadows = {
  small: {
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  glow: {
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const glass = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: borderRadius.lg,
};
