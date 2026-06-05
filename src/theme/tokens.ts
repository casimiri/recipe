// tokens.ts — Sunny design-direction token system (light/dark + accent).
// Ported from the Recipe-Snap design's theme.jsx, scoped to the canonical
// "Sunny" direction with a runtime-selectable accent colour and dark mode.

export function hexLum(hex: string): number {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function withA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export interface Tokens {
  accent: string;
  accentText: string;
  accentSoft: string;
  accentSofter: string;
  star: string;
  danger: string;
  body: string;
  heading: string;
  hWeight: '400' | '500' | '600' | '700' | '800';
  hSpacing: number;
  radius: number;
  radiusSm: number;
  radiusLg: number;
  bg: string;
  surface: string;
  surface2: string;
  elevated: string;
  text: string;
  muted: string;
  faint: string;
  border: string;
  borderStrong: string;
  shadow: string;
  shadowLg: string;
  dark: boolean;
  withA: typeof withA;
}

export const ACCENTS = ['#F5B301', '#FF7A1A', '#E5484D', '#16A34A', '#6E56CF'];

/** Font family aliases registered by expo-font in the ThemeProvider. */
export const FONT = {
  r: 'Jakarta_400Regular',
  m: 'Jakarta_500Medium',
  sb: 'Jakarta_600SemiBold',
  b: 'Jakarta_700Bold',
  xb: 'Jakarta_800ExtraBold',
};

export function makeTokens({ accent = '#F5B301', dark = false }: { accent?: string; dark?: boolean } = {}): Tokens {
  const accentText = hexLum(accent) > 0.45 ? '#1A1707' : '#FFFFFF';
  const light = {
    bg: '#F3F3F1', surface: '#FFFFFF', surface2: '#F6F6F3', elevated: '#FFFFFF',
    text: '#17170F', muted: '#86867C', faint: '#B6B6AC',
    border: 'rgba(20,20,12,0.07)', borderStrong: 'rgba(20,20,12,0.12)',
    shadow: '0 6px 20px rgba(30,30,16,0.07)', shadowLg: '0 18px 44px rgba(30,30,16,0.12)',
  };
  const darkM = {
    bg: '#0D0D0F', surface: '#1A1A1E', surface2: '#232329', elevated: '#222227',
    text: '#F4F4F1', muted: '#9B9B96', faint: '#65656B',
    border: 'rgba(255,255,255,0.08)', borderStrong: 'rgba(255,255,255,0.14)',
    shadow: '0 6px 20px rgba(0,0,0,0.4)', shadowLg: '0 18px 44px rgba(0,0,0,0.55)',
  };
  const mode = dark ? darkM : light;
  return {
    accent,
    accentText,
    accentSoft: withA(accent, dark ? 0.2 : 0.14),
    accentSofter: withA(accent, dark ? 0.12 : 0.08),
    star: '#F5B301',
    danger: '#E5484D',
    body: FONT.r,
    heading: FONT.xb,
    hWeight: '800',
    hSpacing: -0.5,
    radius: 22,
    radiusSm: 14,
    radiusLg: 30,
    ...mode,
    dark,
    withA,
  };
}
