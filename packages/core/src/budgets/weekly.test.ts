import { describe, expect, it } from 'vitest'
import type { Movement, MovementCategory } from '../movements'
import type { WeeklyBudget } from './types'
import { summarizeWeeklyBudgets, weeklyBudgetProgress } from './weekly'

const super_: MovementCategory = {
  id: 'c-super',
  name: 'Supermercado',
  kind: 'expense',
  archived: false,
  emoji: 'shopping_cart',
}
const salidas: MovementCategory = {
  id: 'c-salidas',
  name: 'Salidas',
  kind: 'expense',
  archived: false,
  emoji: 'package',
}

let seq = 0
const movement = (
  category: MovementCategory,
  amount: number,
  occurredOn: string,
  currency: 'ARS' | 'USD' = 'ARS',
): Movement => {
  seq += 1
  return {
    id: `m-${seq}`,
    category,
    amount: { amount, currency },
    occurredOn,
    description: null,
    createdAt: `${occurredOn}T12:00:00Z`,
  }
}

const weekly = (
  category: MovementCategory,
  amount: number,
  currency: 'ARS' | 'USD' = 'ARS',
): WeeklyBudget => ({
  id: `w-${category.id}-${currency}`,
  amount: { amount, currency },
  category: { id: category.id, name: category.name, archived: false, emoji: category.emoji },
})

// Week of Monday 28/9 to Sunday 4/10, across two months
const movements = [
  movement(super_, 1500000, '2026-09-28'),
  movement(super_, 1000000, '2026-10-04'),
  movement(super_, 999999, '2026-10-05'), // next week
  movement(super_, 777, '2026-09-27'), // previous week
  movement(super_, 500, '2026-09-30', 'USD'),
  movement(salidas, 300000, '2026-10-01'),
]

describe('weeklyBudgetProgress', () => {
  it("adds only that week's expenses in its category and currency, across months", () => {
    const progress = weeklyBudgetProgress(weekly(super_, 4000000), movements, '2026-09-28')
    expect(progress.spent).toEqual({ amount: 2500000, currency: 'ARS' })
    expect(progress.remaining).toEqual({ amount: 1500000, currency: 'ARS' })
    expect(progress.status).toBe('ok')
  })

  it('uses the same statuses as monthly budgets', () => {
    expect(weeklyBudgetProgress(weekly(super_, 3000000), movements, '2026-09-28').status).toBe(
      'warning',
    ) // 83%
    expect(weeklyBudgetProgress(weekly(super_, 2000000), movements, '2026-09-28').status).toBe(
      'exceeded',
    )
  })
})

describe('summarizeWeeklyBudgets', () => {
  it("sums the week's budgets per currency, sorted by category name", () => {
    const summary = summarizeWeeklyBudgets(
      [weekly(super_, 4000000), weekly(salidas, 200000), weekly(super_, 1000, 'USD')],
      movements,
      '2026-09-28',
    )
    expect(summary.ARS.budgeted).toEqual({ amount: 4200000, currency: 'ARS' })
    expect(summary.ARS.spent).toEqual({ amount: 2800000, currency: 'ARS' })
    expect(summary.ARS.progress.map((p) => p.budget.category.name)).toEqual([
      'Salidas',
      'Supermercado',
    ])
    expect(summary.USD.spent).toEqual({ amount: 500, currency: 'USD' })
  })
})
