import { describe, expect, it } from 'vitest'
import type { BudgetProgress, BudgetStatus } from '../budgets'
import type { CurrencySummary } from '../balance'
import type { Currency } from '../money'
import { dayPart, greeting, monthMood, moodMessage, type MonthMood } from './mood'

function summary(income: number, expense: number, currency: Currency = 'ARS'): CurrencySummary {
  return {
    income: { amount: income, currency },
    expense: { amount: expense, currency },
    net: { amount: income - expense, currency },
    incomeByCategory: [],
    expenseByCategory: [],
  }
}

function progress(name: string, spent: number, limit: number, currency: Currency = 'ARS') {
  const ratio = spent / limit
  const status: BudgetStatus = spent > limit ? 'exceeded' : ratio >= 0.8 ? 'warning' : 'ok'
  return {
    budget: {
      id: `b-${name}`,
      month: '2026-10',
      amount: { amount: limit, currency },
      category: { id: `c-${name}`, name, archived: false, emoji: 'package' },
    },
    spent: { amount: spent, currency },
    remaining: { amount: limit - spent, currency },
    ratio,
    status,
  } satisfies BudgetProgress
}

describe('monthMood', () => {
  it('is empty when the month has no movements at all', () => {
    expect(monthMood({ hasMovements: false, summary: summary(0, 0), budgets: [] })).toEqual({
      kind: 'empty',
    })
  })

  it('is quiet when the month has movements, but none in this currency', () => {
    const budgets = [progress('Supermercado', 0, 30000, 'USD')]
    expect(monthMood({ hasMovements: true, summary: summary(0, 0, 'USD'), budgets })).toEqual({
      kind: 'quiet',
      currency: 'USD',
    })
  })

  it('names the budget that went over the most, before anything else', () => {
    const budgets = [
      progress('Restaurantes', 13240000, 10000000), // 132%
      progress('Salidas', 13000000, 12000000), // 108%
      progress('Supermercado', 9500000, 10000000), // warning
    ]
    const mood = monthMood({ hasMovements: true, summary: summary(50000000, 1000), budgets })

    expect(mood.kind).toBe('exceeded')
    expect(mood.kind === 'exceeded' && mood.budget.budget.category.name).toBe('Restaurantes')
  })

  it('is negative when more went out than came in and no budget went over', () => {
    const net = summary(100000, 150000).net
    expect(
      monthMood({ hasMovements: true, summary: summary(100000, 150000), budgets: [] }),
    ).toEqual({ kind: 'negative', net })
  })

  it('names the budget closest to its limit when one is in warning', () => {
    const budgets = [
      progress('Servicios', 8000, 10000), // 80%
      progress('Supermercado', 8200, 10000), // 82%
      progress('Transporte', 1000, 10000),
    ]
    const mood = monthMood({ hasMovements: true, summary: summary(100000, 17200), budgets })

    expect(mood.kind).toBe('warning')
    expect(mood.kind === 'warning' && mood.budget.budget.category.name).toBe('Supermercado')
  })

  it('is good otherwise, with the net result', () => {
    const budgets = [progress('Servicios', 6600, 10000)]
    expect(monthMood({ hasMovements: true, summary: summary(100000, 6600), budgets })).toEqual({
      kind: 'good',
      net: { amount: 93400, currency: 'ARS' },
    })
  })

  it('is good with a net result of exactly zero', () => {
    expect(monthMood({ hasMovements: true, summary: summary(5000, 5000), budgets: [] }).kind).toBe(
      'good',
    )
  })
})

describe('moodMessage', () => {
  const midMonth = { month: '2026-10', today: '2026-10-12' }
  const lastDay = { month: '2026-10', today: '2026-10-31' }
  const pastMonth = { month: '2026-09', today: '2026-10-12' }

  it.each<[string, MonthMood, string]>([
    ['empty', { kind: 'empty' }, 'Arranquemos octubre: todavía no cargaste nada.'],
    ['quiet', { kind: 'quiet', currency: 'ARS' }, 'Este mes no hay movimientos en pesos.'],
    [
      'good',
      { kind: 'good', net: { amount: 41230000, currency: 'ARS' } },
      '¡Vas bárbaro! Este mes te sobran $ 412.300.',
    ],
    [
      'good at zero',
      { kind: 'good', net: { amount: 0, currency: 'ARS' } },
      'Este mes quedaste justo.',
    ],
    [
      'negative',
      { kind: 'negative', net: { amount: -5000, currency: 'ARS' } },
      'Este mes salió más de lo que entró.',
    ],
    [
      'warning',
      { kind: 'warning', budget: progress('Supermercado', 8240, 10000) },
      'Ojo: Supermercado ya va por el 82%.',
    ],
    [
      'exceeded',
      { kind: 'exceeded', budget: progress('Restaurantes', 13240, 10000) },
      'Te pasaste en Restaurantes. Tranqui, todavía queda mes para acomodarlo.',
    ],
  ])('%s', (_, mood, expected) => {
    expect(moodMessage(mood, midMonth)).toBe(expected)
  })

  it('names the currency when the month is quiet in dollars', () => {
    expect(moodMessage({ kind: 'quiet', currency: 'USD' }, midMonth)).toBe(
      'Este mes no hay movimientos en dólares.',
    )
  })

  it('names the month it is about when it is empty', () => {
    expect(moodMessage({ kind: 'empty' }, pastMonth)).toBe(
      'Arranquemos septiembre: todavía no cargaste nada.',
    )
  })

  it('does not say there is month left on its last day or in another month', () => {
    const mood: MonthMood = { kind: 'exceeded', budget: progress('Restaurantes', 13240, 10000) }
    expect(moodMessage(mood, lastDay)).toBe('Te pasaste en Restaurantes.')
    expect(moodMessage(mood, pastMonth)).toBe('Te pasaste en Restaurantes.')
  })

  it('cuts category names longer than 24 characters', () => {
    const mood: MonthMood = {
      kind: 'warning',
      budget: progress('Mantenimiento del auto y la moto', 9000, 10000),
    }
    expect(moodMessage(mood, midMonth)).toBe('Ojo: Mantenimiento del auto y… ya va por el 90%.')
  })
})

describe('dayPart', () => {
  const at = (hours: number, minutes = 0) => new Date(2026, 9, 12, hours, minutes)

  it.each([
    [at(4, 59), 'night'],
    [at(5), 'morning'],
    [at(11, 59), 'morning'],
    [at(12), 'afternoon'],
    [at(19, 59), 'afternoon'],
    [at(20), 'night'],
    [at(0), 'night'],
  ] as const)('%s → %s', (date, expected) => {
    expect(dayPart(date)).toBe(expected)
  })
})

describe('greeting', () => {
  it.each([
    ['morning', 'Buen día'],
    ['afternoon', 'Buenas tardes'],
    ['night', 'Buenas noches'],
  ] as const)('%s → %s', (part, expected) => {
    expect(greeting(part)).toBe(expected)
  })
})
