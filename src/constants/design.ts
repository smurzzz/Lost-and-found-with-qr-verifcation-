/**
 * ClaimIt v3 design system — ported 1:1 from the Lovable/Tailwind source
 * (claimit-src/src/styles.css). oklch values converted to sRGB hex.
 * The old theme.ts stays untouched (login still uses it).
 */

export const Colors = {
  background: '#f4f7f9',
  foreground: '#050c1e',
  card: '#ffffff',
  cardForeground: '#050c1e',
  primary: '#0c2156',
  primaryForeground: '#f8fafc',
  primarySoft: '#e2ecfc',
  secondary: '#e9f0f5',
  secondaryForeground: '#0f172b',
  muted: '#eaeff3',
  mutedForeground: '#5c6a7d',
  accent: '#f1f5f9',
  accentForeground: '#0f172b',
  destructive: '#e7000b',
  destructiveForeground: '#f8fafc',
  border: '#d9e3eb',
  input: '#e2e8f0',
  ring: '#90a1b9',
  success: '#00bc7b',
  successForeground: '#004725',
  successSoft: '#c6f5da',
  pending: '#eba002',
  pendingForeground: '#814300',
  pendingSoft: '#ffefbc',
  canvas: '#e2e9ee',
  scan: '#050e1a',
} as const;

export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** --radius: 0.75rem with the Tailwind scale offsets. */
export const Radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  /** rounded-2xl */
  input: 16,
  /** rounded-card (1.25rem) */
  card: 20,
  /** rounded-[2rem] / center nav tile / success blocks */
  xl2: 32,
  /** rounded-[2.5rem] device frame */
  device: 40,
  full: 9999,
} as const;

export const Shadows = {
  /** shadow-card: 0 8px 28px oklch(0.15 0.03 260 / 0.07) */
  card: {
    shadowColor: '#0b1230',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  /** shadow-float */
  float: {
    shadowColor: '#0b1230',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 25,
    elevation: 8,
  },
  /** shadow-brand */
  brand: {
    shadowColor: '#0b1230',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  /** shadow-nav */
  nav: {
    shadowColor: '#0b1230',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
} as const;
