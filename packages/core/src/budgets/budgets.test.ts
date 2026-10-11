import { describe, expect, it } from 'vitest'
import type { Currency } from '../money'
import type { Movement, MovementCategory } from '../movements'
import { budgetProgress, budgetsToCopy, formatBudgetStatus, summarizeBudgets } from './budgets'
import type { Budget } from './types'

const categories = {
  super: { id: 'c-super', name: 'Supermercado', kind: 'expense', archived: false },
  transporte: { id: 'c-transporte', name: 'Transporte', kind: 'expense', archived: false },
  salidas: { id: 'c-salidas', name: 'Salidas', kind: 'expense', archived: true },
  educacion: { id: 'c-educacion', name: 'Educación', kind: 'expense', archived: false },
  sueldo: { id: 'c-sueldo', name: 'Sueldo', kind: 'income', archived: false },
} as const satisfies Record<string, MovementCategory>

let seq = 0

function movement(
  category: MovementCategory,
  amount: number,
  {
    currency = 'ARS',
    occurredOn = '2026-10-07',
  }: { currency?: Currency; occurredOn?: string } = {},
): Movement {
  seq += 1
  return {
    id: `m-${seq}`,
    amount: { amount, currency },
    occurredOn,
    description: null,
    category,
    createdAt: '2026-10-07T12:00:00.000000+00:00',
  }
}

function budget(
  category: MovementCategory,
  amount: number,
  { currency = 'ARS', month = '2026-10' }: { currency?: Currency; month?: string } = {},
): Budget {
  seq += 1
  const { id, name, archived } = category
  return { id: `b-${seq}`, month, amount: { amount, currency }, category: { id, name, archived } }
}

describe('budgetProgress', () => {
  it('adds the expenses of its category, currency and month', () => {
    const b = budget(categories.super, 6000000)
    const progress = budgetProgress(b, [
      movement(categories.super, 3000000),
      movement(categories.super, 1500000),
      movement(categories.super, 99, { currency: 'USD' }),
      movement(categories.super, 77, { occurredOn: '2026-09-30' }),
      movement(categories.super, 66, { occurredOn: '2026-11-01' }),
      movement(categories.transporte, 55),
      movement(categories.sueldo, 44),
    ])

    expect(progress).toEqual({
      budget: b,
      spent: { amount: 4500000, currency: 'ARS' },
      remaining: { amount: 1500000, currency: 'ARS' },
      ratio: 0.75,
      status: 'ok',
    })
  })

  it('starts at zero without expenses', () => {
    const progress = budgetProgress(budget(categories.super, 1000), [])

    expect(progress.spent).toEqual({ amount: 0, currency: 'ARS' })
    expect(progress.remaining).toEqual({ amount: 1000, currency: 'ARS' })
    expect(progress.ratio).toBe(0)
    expect(progress.status).toBe('ok')
  })

  it.each([
    [4799999, 'ok'],
    [4800000, 'warning'],
    [5999999, 'warning'],
    [6000000, 'warning'],
    [6000001, 'exceeded'],
    [6500000, 'exceeded'],
  ] as const)('spending %i of 6000000 is %s', (spent, status) => {
    const progress = budgetProgress(budget(categories.super, 6000000), [
      movement(categories.super, spent),
    ])

    expect(progress.status).toBe(status)
  })

  it('gives a negative remainder and a ratio over 1 when exceeded', () => {
    const progress = budgetProgress(budget(categories.super, 6000000), [
      movement(categories.super, 6500000),
    ])

    expect(progress.remaining).toEqual({ amount: -500000, currency: 'ARS' })
    expect(progress.ratio).toBeCloseTo(1.0833, 4)
  })

  it('compares with 80% exactly, even with huge amounts', () => {
    // With floats, 5214614066632019 >= 6518267583290024 * 0.8 is true, but 80% is ...019.2
    const b = budget(categories.super, 6518267583290024)

    expect(budgetProgress(b, [movement(categories.super, 5214614066632019)]).status).toBe('ok')
    expect(budgetProgress(b, [movement(categories.super, 5214614066632020)]).status).toBe('warning')
  })
})

describe('formatBudgetStatus', () => {
  const progressOf = (spent: number) =>
    budgetProgress(budget(categories.super, 6000000), [movement(categories.super, spent)])

  it.each([
    [4500000, 'Quedan $ 15.000,00'],
    [5800000, 'Quedan $ 2.000,00 · Cerca del límite'],
    [6000000, 'Quedan $ 0,00 · Cerca del límite'],
    [6500000, 'Te pasaste por $ 5.000,00'],
  ])('spending %i → %s', (spent, text) => {
    expect(formatBudgetStatus(progressOf(spent))).toBe(text)
  })
})

describe('summarizeBudgets', () => {
  it('returns every currency empty without budgets or expenses', () => {
    const summary = summarizeBudgets([], [], '2026-10')

    for (const currency of ['ARS', 'USD'] as const) {
      expect(summary[currency]).toEqual({
        budgeted: { amount: 0, currency },
        spent: { amount: 0, currency },
        unbudgetedSpent: { amount: 0, currency },
        progress: [],
      })
    }
  })

  it('groups budgets per currency, sorted by category name', () => {
    const budgets = [
      budget(categories.transporte, 2000000),
      budget(categories.super, 6000000),
      budget(categories.educacion, 1000000),
      budget(categories.super, 10000, { currency: 'USD' }),
    ]
    const summary = summarizeBudgets(
      budgets,
      [
        movement(categories.super, 4500000),
        movement(categories.transporte, 2500000),
        movement(categories.super, 5000, { currency: 'USD' }),
      ],
      '2026-10',
    )

    expect(summary.ARS.progress.map((p) => p.budget.category.name)).toEqual([
      'Educación',
      'Supermercado',
      'Transporte',
    ])
    expect(summary.ARS.budgeted).toEqual({ amount: 9000000, currency: 'ARS' })
    expect(summary.ARS.spent).toEqual({ amount: 7000000, currency: 'ARS' })
    expect(summary.USD.progress).toHaveLength(1)
    expect(summary.USD.budgeted).toEqual({ amount: 10000, currency: 'USD' })
    expect(summary.USD.spent).toEqual({ amount: 5000, currency: 'USD' })
  })

  it('reports expenses in categories without a budget in that currency apart', () => {
    const summary = summarizeBudgets(
      [budget(categories.super, 6000000)],
      [
        movement(categories.super, 4500000),
        movement(categories.transporte, 200000),
        movement(categories.salidas, 100000),
        movement(categories.super, 3000, { currency: 'USD' }),
        movement(categories.sueldo, 900000),
        movement(categories.transporte, 999, { occurredOn: '2026-09-15' }),
      ],
      '2026-10',
    )

    expect(summary.ARS.unbudgetedSpent).toEqual({ amount: 300000, currency: 'ARS' })
    expect(summary.USD.unbudgetedSpent).toEqual({ amount: 3000, currency: 'USD' })
    expect(summary.USD.progress).toEqual([])
  })
})

describe('budgetsToCopy', () => {
  it('copies every budget to the next month with the same amount, except archived ones', () => {
    const previous = [
      budget(categories.super, 6000000, { month: '2026-09' }),
      budget(categories.salidas, 100000, { month: '2026-09' }),
      budget(categories.super, 10000, { currency: 'USD', month: '2026-09' }),
    ]

    expect(budgetsToCopy(previous, '2026-10')).toEqual([
      { categoryId: 'c-super', month: '2026-10', amount: { amount: 6000000, currency: 'ARS' } },
      { categoryId: 'c-super', month: '2026-10', amount: { amount: 10000, currency: 'USD' } },
    ])
  })

  it('crosses years', () => {
    const previous = [budget(categories.super, 100, { month: '2026-12' })]

    expect(budgetsToCopy(previous, '2027-01')).toEqual([
      { categoryId: 'c-super', month: '2027-01', amount: { amount: 100, currency: 'ARS' } },
    ])
  })

  it('copies nothing from an empty month', () => {
    expect(budgetsToCopy([], '2026-10')).toEqual([])
  })
})
