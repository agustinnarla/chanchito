import { z } from 'zod'

/** The accent palettes (spec 011). Their colors live in the app's CSS: this is only the choice. */
export const ACCENTS = ['verde', 'azul', 'violeta', 'rosa', 'naranja', 'turquesa'] as const

export const AccentSchema = z.enum(ACCENTS)

export type Accent = z.infer<typeof AccentSchema>

/** The approved green of spec 006. */
export const DEFAULT_ACCENT: Accent = 'verde'

export const ACCENT_LABELS: Record<Accent, string> = {
  verde: 'Verde',
  azul: 'Azul',
  violeta: 'Violeta',
  rosa: 'Rosa',
  naranja: 'Naranja',
  turquesa: 'Turquesa',
}

/** A stored accent, or green when it's unknown (for example, from a future version). */
export function resolveAccent(value: unknown): Accent {
  const parsed = AccentSchema.safeParse(value)
  return parsed.success ? parsed.data : DEFAULT_ACCENT
}

/** Light or dark, or following the system. Chosen per device. */
export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const

export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export const THEME_PREFERENCE_LABELS: Record<ThemePreference, string> = {
  system: 'Sistema',
  light: 'Claro',
  dark: 'Oscuro',
}

/** A stored theme choice, or following the system when there's none or it's unknown. */
export function resolveThemePreference(value: unknown): ThemePreference {
  return THEME_PREFERENCES.find((preference) => preference === value) ?? 'system'
}
