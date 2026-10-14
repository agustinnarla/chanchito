import { describe, expect, it } from 'vitest'
import {
  addWeeks,
  currentWeek,
  formatWeekLabel,
  parseWeek,
  weekMonths,
  weekOf,
  weekRange,
} from './weeks'

describe('weekOf', () => {
  it.each([
    ['2026-10-12', '2026-10-12'], // Monday
    ['2026-10-14', '2026-10-12'],
    ['2026-10-18', '2026-10-12'], // Sunday belongs to the week that started on Monday
    ['2026-10-01', '2026-09-28'], // across months
    ['2026-01-01', '2025-12-29'], // across years
  ])('%s → %s', (date, week) => {
    expect(weekOf(date)).toBe(week)
  })
})

describe('addWeeks', () => {
  it.each([
    ['2026-10-12', 1, '2026-10-19'],
    ['2026-10-12', -1, '2026-10-05'],
    ['2026-09-28', 1, '2026-10-05'],
    ['2025-12-29', 1, '2026-01-05'],
    ['2026-01-05', -1, '2025-12-29'],
  ])('%s %+i → %s', (week, delta, expected) => {
    expect(addWeeks(week, delta)).toBe(expected)
  })
})

describe('weekRange', () => {
  it('goes from Monday to the next Monday (exclusive)', () => {
    expect(weekRange('2026-09-28')).toEqual({ from: '2026-09-28', to: '2026-10-05' })
  })
})

describe('formatWeekLabel', () => {
  it.each([
    ['2026-10-12', 'Semana del 12 al 18 de octubre'],
    ['2026-09-28', 'Semana del 28 de septiembre al 4 de octubre'],
    ['2025-12-29', 'Semana del 29 de diciembre de 2025 al 4 de enero de 2026'],
  ])('%s → %s', (week, label) => {
    expect(formatWeekLabel(week)).toBe(label)
  })
})

describe('parseWeek and currentWeek', () => {
  it("takes a Monday, and today's week otherwise", () => {
    expect(parseWeek('2026-10-12', '2026-01-05')).toBe('2026-10-12')
    expect(parseWeek('2026-10-14', '2026-01-05')).toBe('2026-10-12') // any day: its week
    expect(parseWeek('nope', '2026-01-05')).toBe('2026-01-05')
    expect(parseWeek(null, '2026-01-05')).toBe('2026-01-05')
    expect(currentWeek(new Date(2026, 9, 18, 23, 0))).toBe('2026-10-12')
  })
})

describe('weekMonths', () => {
  it('gives the one or two months a week touches, to load their movements', () => {
    expect(weekMonths('2026-10-12')).toEqual(['2026-10'])
    expect(weekMonths('2026-09-28')).toEqual(['2026-09', '2026-10'])
    expect(weekMonths('2025-12-29')).toEqual(['2025-12', '2026-01'])
  })
})
