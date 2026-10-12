import { describe, expect, it } from 'vitest'
import { formatUpdatedAt } from './format'

// Tests run in Argentina's time zone (UTC-3), see vitest.config.ts.
const now = new Date(2026, 9, 12, 21, 0)

describe('formatUpdatedAt', () => {
  it.each([
    ['2026-10-12T14:20:00.000Z', 'hoy a las 11:20'],
    ['2026-10-12T02:59:00.000Z', 'ayer a las 23:59'],
    ['2026-10-11T21:00:00.000Z', 'ayer a las 18:00'],
    ['2026-10-09T13:05:00.000Z', 'el 09/10/2026 a las 10:05'],
  ])('%s → %s', (at, expected) => {
    expect(formatUpdatedAt(at, now)).toBe(expected)
  })
})
