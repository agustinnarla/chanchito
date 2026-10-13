import { describe, expect, it } from 'vitest'
import {
  ACCENT_LABELS,
  ACCENTS,
  AccentSchema,
  DEFAULT_ACCENT,
  resolveAccent,
  resolveThemePreference,
  THEME_PREFERENCE_LABELS,
} from './appearance'

describe('accents', () => {
  it('offers the six palettes, green first and by default', () => {
    expect(ACCENTS).toEqual(['verde', 'azul', 'violeta', 'rosa', 'naranja', 'turquesa'])
    expect(DEFAULT_ACCENT).toBe('verde')
  })

  it('names each one in Spanish', () => {
    expect(ACCENTS.map((accent) => ACCENT_LABELS[accent])).toEqual([
      'Verde',
      'Azul',
      'Violeta',
      'Rosa',
      'Naranja',
      'Turquesa',
    ])
  })

  it('validates a key', () => {
    expect(AccentSchema.safeParse('azul').success).toBe(true)
    expect(AccentSchema.safeParse('amarillo').success).toBe(false)
  })
})

describe('resolveAccent', () => {
  it.each(ACCENTS)('keeps %s', (accent) => {
    expect(resolveAccent(accent)).toBe(accent)
  })

  it.each([['amarillo'], [''], [null], [undefined], [42], ['AZUL']])(
    'falls back to green for %j',
    (value) => {
      expect(resolveAccent(value)).toBe('verde')
    },
  )
})

describe('resolveThemePreference', () => {
  it.each(['system', 'light', 'dark'] as const)('keeps %s', (preference) => {
    expect(resolveThemePreference(preference)).toBe(preference)
  })

  it.each([['oscuro'], [null], [undefined]])('follows the system for %j', (value) => {
    expect(resolveThemePreference(value)).toBe('system')
  })

  it('names each one in Spanish', () => {
    expect(THEME_PREFERENCE_LABELS).toEqual({ system: 'Sistema', light: 'Claro', dark: 'Oscuro' })
  })
})
