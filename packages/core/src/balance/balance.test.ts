import { describe, expect, it } from 'vitest'
import { MoneyError } from '../money'
import type { Movement, MovementCategory } from '../movements'
import { formatShare, summarizeMonth } from './balance'

const categories = {
  super: { id: 'c-super', name: 'Supermercado', kind: 'expense', archived: false },
  transporte: { id: 'c-transporte', name: 'Transporte', kind: 'expense', archived: false },
  salidas: { id: 'c-salidas', name: 'Salidas', kind: 'expense', archived: true },
  educacion: { id: 'c-educacion', name: 'Educación', kind: 'expense', archived: false },
  sueldo: { id: 'c-sueldo', name: 'Sueldo', kind: 'income', archived: false },
  freelance: { id: 'c-freelance', name: 'Freelance', kind: 'income', archived: false },
} as const satisfies Record<string, MovementCategory>

let seq = 0
function movement(
  category: MovementCategory,
  amount: number,
  currency: 'ARS' | 'USD' = 'ARS',
): Movement {
  seq += 1
  return {
    id: `m-${seq}`,
    amount: { amount, currency },
    occurredOn: '2026-10-07',
    description: null,
    category,
    createdAt: `2026-10-07T12:00:00.000000+00:00`,
  }
}

describe('summarizeMonth', () => {
  it('returns every currency in zero without movements', () => {
    const summary = summarizeMonth([])

    for (const currency of ['ARS', 'USD'] as const) {
      expect(summary[currency]).toEqual({
        income: { amount: 0, currency },
        expense: { amount: 0, currency },
        net: { amount: 0, currency },
        incomeByCategory: [],
        expenseByCategory: [],
      })
    }
  })

  it('adds income and expenses and calculates the net result', () => {
    const summary = summarizeMonth([
      movement(categories.super, 100000),
      movement(categories.sueldo, 300000),
    ])

    expect(summary.ARS.income).toEqual({ amount: 300000, currency: 'ARS' })
    expect(summary.ARS.expense).toEqual({ amount: 100000, currency: 'ARS' })
    expect(summary.ARS.net).toEqual({ amount: 200000, currency: 'ARS' })
  })

  it('gives a negative net result when expenses exceed income', () => {
    const summary = summarizeMonth([
      movement(categories.super, 15000, 'USD'),
      movement(categories.sueldo, 10000, 'USD'),
    ])

    expect(summary.USD.net).toEqual({ amount: -5000, currency: 'USD' })
  })

  it('never mixes currencies', () => {
    const summary = summarizeMonth([
      movement(categories.super, 100000, 'ARS'),
      movement(categories.super, 5000, 'USD'),
      movement(categories.sueldo, 20000, 'USD'),
    ])

    expect(summary.ARS.expense.amount).toBe(100000)
    expect(summary.ARS.income.amount).toBe(0)
    expect(summary.USD.expense.amount).toBe(5000)
    expect(summary.USD.income.amount).toBe(20000)
    expect(summary.ARS.expenseByCategory.map((t) => t.total)).toEqual([
      { amount: 100000, currency: 'ARS' },
    ])
    expect(summary.USD.expenseByCategory.map((t) => t.total)).toEqual([
      { amount: 5000, currency: 'USD' },
    ])
  })

  it('groups by category, from the largest total to the smallest, with its share', () => {
    const summary = summarizeMonth([
      movement(categories.salidas, 10000),
      movement(categories.super, 40000),
      movement(categories.transporte, 30000),
      movement(categories.super, 20000),
    ])

    expect(summary.ARS.expenseByCategory).toEqual([
      { category: categories.super, total: { amount: 60000, currency: 'ARS' }, share: 0.6 },
      { category: categories.transporte, total: { amount: 30000, currency: 'ARS' }, share: 0.3 },
      { category: categories.salidas, total: { amount: 10000, currency: 'ARS' }, share: 0.1 },
    ])
  })

  it('keeps income and expenses apart, each share over its own kind', () => {
    const summary = summarizeMonth([
      movement(categories.super, 10000),
      movement(categories.sueldo, 75000),
      movement(categories.freelance, 25000),
    ])

    expect(summary.ARS.expenseByCategory.map((t) => [t.category.id, t.share])).toEqual([
      ['c-super', 1],
    ])
    expect(summary.ARS.incomeByCategory.map((t) => [t.category.id, t.share])).toEqual([
      ['c-sueldo', 0.75],
      ['c-freelance', 0.25],
    ])
  })

  it('sorts categories with the same total by name, in Spanish', () => {
    const summary = summarizeMonth([
      movement(categories.transporte, 5000),
      movement(categories.super, 5000),
      movement(categories.educacion, 5000),
    ])

    expect(summary.ARS.expenseByCategory.map((t) => t.category.name)).toEqual([
      'Educación',
      'Supermercado',
      'Transporte',
    ])
  })

  it('adds large amounts without losing precision', () => {
    const summary = summarizeMonth([
      movement(categories.super, 100_000_000_000),
      movement(categories.transporte, 100_000_000_000),
      movement(categories.super, 1),
    ])

    expect(summary.ARS.expense.amount).toBe(200_000_000_001)
    expect(summary.ARS.expenseByCategory[0]?.total.amount).toBe(100_000_000_001)
  })

  it('fails instead of returning a wrong total when the sum is too large', () => {
    const huge = movement(categories.super, Number.MAX_SAFE_INTEGER)

    expect(() => summarizeMonth([huge, movement(categories.super, 1)])).toThrow(MoneyError)
  })
})

describe('formatShare', () => {
  it.each([
    [1, '100%'],
    [0.6, '60%'],
    [0.344, '34%'],
    [0.005, '1%'],
    [0.0049, '<1%'],
    [0.0001, '<1%'],
    [0, '0%'],
  ])('%f → %s', (share, expected) => {
    expect(formatShare(share)).toBe(expected)
  })
})
