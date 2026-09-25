/**
 * ClaimIt design system tokens — colors, fonts, spacing, radius, shadows.
 * Source of truth: the screen mockups in /assets + the prototype CSS
 * (tokens: --ink #111a43, --orange #f5a623, --lavender #f2f1ff, etc.).
 */

import { Platform } from 'react-native';

/**
 * Font family names. These must match the keys passed to useFonts() in
 * app/_layout.tsx — with expo-font, the map key IS the family name.
 */
export const Fonts = {
  dm: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semibold: 'DMSans_600SemiBold',
    bold: 'DMSans_700Bold',
  },
  jakarta: {
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extrabold: 'PlusJakartaSans_800ExtraBold',
  },
  /** Monospace fallback for code-style text. */
  mono: Platform.select({
    ios: 'ui-monospace',
    android: 'monospace',
    web: 'var(--font-mono)',
    default: 'monospace',
  }),
} as const;

/** The mockups are a light-first design; both schemes share the palette. */
const palette = {
  text: '#111a43', // --ink
  textSecondary: '#7a7c9a', // --muted
  accent: '#6667ad', // secondary heading accent in mockups

  background: '#fbfbfe', // page background
  lavender: '#f2f1ff', // --lavender (screen background)
  backgroundElement: '#f0eff9', // raised tint surfaces
  backgroundSelected: '#e9e8fb', // --lavender-2
  surface: '#ffffff', // cards

  line: '#dfdef0', // --line (hairline borders)
  lineStrong: '#c9c8e2',

  orange: '#f5a623', // --orange (brand accent)
  orangeSoft: '#fff1d6', // --orange-soft
  green: '#16a779', // --green
  greenSoft: '#dff6ed', // --green-soft
  danger: '#c85f6d',
} as const;

/**
 * Brand palette from the v3 home-feed mockup (2026 redesign): navy/blue/orange
 * over a cool light background. Additive — existing screens keep `palette`.
 */
export const brand = {
  navy: '#121F3E',
  blue: '#2B4BF2',
  orange: '#F97316',
  amberBg: '#FEF3C7',
  amberText: '#D97706',
  bgLight: '#EEF1F8',
  cardBg: '#FFFFFF',
  textDark: '#0F172A',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  borderLight: '#E2E8F0',
} as const;

export const Colors = { light: palette, dark: palette };
export type ThemeColor = keyof typeof palette;

export const Spacing = {
  half: 2,
  xs: 6,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12, // buttons, inputs
  lg: 16, // cards
  xl: 22, // bottom sheets
  pill: 999,
} as const;

/** Soft card shadow seen on white cards in the mockups. */
export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#2b2a66',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
    },
    android: { elevation: 2 },
    web: { boxShadow: '0 5px 14px rgba(43,42,102,0.08)' },
    default: {},
  }),
  float: Platform.select({
    ios: {
      shadowColor: '#f5a623',
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
    },
    android: { elevation: 4 },
    web: { boxShadow: '0 5px 12px rgba(245,166,35,0.35)' },
    default: {},
  }),
  /** Neutral soft shadow used by the v3 white feed cards. */
  soft: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: 2 },
    web: { boxShadow: '0 3px 10px rgba(15,23,42,0.06)' },
    default: {},
  }),
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
