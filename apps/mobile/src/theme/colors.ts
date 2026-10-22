/**
 * The green palette of apps/web/src/index.css (specs 006 and 011): Material 3 tonal surfaces,
 * no shadows or borders between blocks. Keep both in sync when a color changes.
 */
export const COLORS = {
  light: {
    background: '#f1fded',
    foreground: '#141e14',
    surfaceLow: '#e6f1e1',
    surface: '#dbe8d6',
    surfaceHigh: '#d0dccb',
    mutedForeground: '#3b4b3b',
    /** Main action ("Nuevo movimiento", Guardar) */
    primary: '#00753a',
    primaryForeground: '#ffffff',
    /** Chosen section or option */
    active: '#9afda6',
    activeForeground: '#00391a',
    income: '#006e2c',
    link: '#006e2c',
    destructive: '#ba1a1a',
    border: '#b9cbb7',
    ring: '#00753a',
    badChip: '#ffdad6',
    badOnChip: '#410002',
  },
  dark: {
    background: '#0c160d',
    foreground: '#dae6d6',
    surfaceLow: '#141e14',
    surface: '#1b261b',
    surfaceHigh: '#263226',
    mutedForeground: '#b9cbb7',
    primary: '#00f46b',
    primaryForeground: '#00391a',
    active: '#1f4a28',
    activeForeground: '#c8ffd0',
    income: '#7dff9e',
    link: '#7dff9e',
    destructive: '#ffb4ab',
    border: '#3b4b3b',
    ring: '#00c957',
    badChip: '#4d1a16',
    badOnChip: '#ffdad6',
  },
} as const satisfies Record<'light' | 'dark', Record<string, string>>

export type Colors = { [K in keyof (typeof COLORS)['light']]: string }
