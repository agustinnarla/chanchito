import { describe, expect, it } from 'vitest'
import {
  addMonths,
  currentMonth,
  formatDate,
  formatMonthLabel,
  IsoDateSchema,
  monthOf,
  monthRange,
  MonthSchema,
  parseMonth,
  todayIso,
} from './dates'

/** A local date-time, as the browser would see it in Argentina. */
const localDateTime = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min)

describe('todayIso', () => {
  it('runs in a timezone west of UTC, so the next tests are meaningful', () => {
    expect(localDateTime(2026, 10, 31, 23, 30).toISOString()).toBe('2026-11-01T02:30:00.000Z')
  })

  it('returns the local date as aaaa-mm-dd', () => {
    expect(todayIso(localDateTime(2026, 10, 7))).toBe('2026-10-07')
  })

  it('uses the local date late at night, not the UTC one', () => {
    // 23:30 local on Oct 31 is already Nov 1 in UTC for timezones west of Greenwich.
    expect(todayIso(localDateTime(2026, 10, 31, 23, 30))).toBe('2026-10-31')
  })

  it('uses the local date right after midnight', () => {
    expect(todayIso(localDateTime(2026, 11, 1, 0, 5))).toBe('2026-11-01')
  })
})

describe('currentMonth and monthOf', () => {
  it('returns the month of a local date-time', () => {
    expect(currentMonth(localDateTime(2026, 1, 31, 23, 59))).toBe('2026-01')
  })

  it('returns the month of an ISO date', () => {
    expect(monthOf('2026-12-31')).toBe('2026-12')
  })
})

describe('IsoDateSchema', () => {
  it.each(['2026-10-07', '2024-02-29', '2026-12-31', '2026-01-01'])('accepts %s', (date) => {
    expect(IsoDateSchema.safeParse(date).success).toBe(true)
  })

  it.each(['2026-02-29', '2026-13-01', '2026-04-31', '07/10/2026', '2026-1-7', '', 'hoy'])(
    'rejects %j',
    (date) => {
      expect(IsoDateSchema.safeParse(date).success).toBe(false)
    },
  )
})

describe('MonthSchema and parseMonth', () => {
  it.each(['2026-01', '2026-12', '1999-07'])('accepts %s', (month) => {
    expect(MonthSchema.safeParse(month).success).toBe(true)
  })

  it.each(['2026-13', '2026-00', '2026-1', 'hola', '', '2026-10-01'])('rejects %j', (month) => {
    expect(MonthSchema.safeParse(month).success).toBe(false)
  })

  it('returns a valid month as is', () => {
    expect(parseMonth('2026-03', '2026-10')).toBe('2026-03')
  })

  it.each([null, undefined, '2026-13', 'hola'])('falls back for %j', (value) => {
    expect(parseMonth(value, '2026-10')).toBe('2026-10')
  })
})

describe('monthRange', () => {
  it('goes from the first day to the first day of the next month (exclusive)', () => {
    expect(monthRange('2026-10')).toEqual({ from: '2026-10-01', to: '2026-11-01' })
  })

  it('crosses the year in December', () => {
    expect(monthRange('2026-12')).toEqual({ from: '2026-12-01', to: '2027-01-01' })
  })

  it('works for February in a leap year', () => {
    expect(monthRange('2024-02')).toEqual({ from: '2024-02-01', to: '2024-03-01' })
  })
})

describe('addMonths', () => {
  it.each([
    ['2026-10', 1, '2026-11'],
    ['2026-10', -1, '2026-09'],
    ['2026-12', 1, '2027-01'],
    ['2026-01', -1, '2025-12'],
    ['2026-01', -13, '2024-12'],
    ['2026-05', 0, '2026-05'],
  ] as const)('%s %+d → %s', (month, delta, expected) => {
    expect(addMonths(month, delta)).toBe(expected)
  })
})

describe('formatDate', () => {
  it('formats as dd/mm/aaaa', () => {
    expect(formatDate('2026-10-07')).toBe('07/10/2026')
    expect(formatDate('2024-02-29')).toBe('29/02/2024')
  })
})

describe('formatMonthLabel', () => {
  it.each([
    ['2026-01', 'Enero 2026'],
    ['2026-10', 'Octubre 2026'],
    ['2026-12', 'Diciembre 2026'],
  ])('%s → %s', (month, label) => {
    expect(formatMonthLabel(month)).toBe(label)
  })
})
