import { compareCategoryNames } from '../categories'
import { addMoney, type Currency, type Money } from '../money'
import type { Movement, MovementCategory } from '../movements'
import type { CategoryTotal, CurrencySummary, MonthSummary } from './types'

/**
 * Totals per currency and per category of the given movements (a month's, usually).
 * The balance is always calculated, never stored. Throws `MoneyError` if a total is too large.
 */
export function summarizeMonth(movements: readonly Movement[]): MonthSummary {
  return {
    ARS: summarizeCurrency(movements, 'ARS'),
    USD: summarizeCurrency(movements, 'USD'),
  }
}

function summarizeCurrency(movements: readonly Movement[], currency: Currency): CurrencySummary {
  const inCurrency = movements.filter((m) => m.amount.currency === currency)
  const incomeByCategory = totalsByCategory(inCurrency.filter((m) => m.category.kind === 'income'))
  const expenseByCategory = totalsByCategory(
    inCurrency.filter((m) => m.category.kind === 'expense'),
  )
  const income = sum(
    incomeByCategory.map((t) => t.total),
    currency,
  )
  const expense = sum(
    expenseByCategory.map((t) => t.total),
    currency,
  )

  return {
    income,
    expense,
    net: addMoney(income, { amount: -expense.amount, currency }),
    incomeByCategory: withShares(incomeByCategory, income),
    expenseByCategory: withShares(expenseByCategory, expense),
  }
}

type Grouped = { category: MovementCategory; total: Money }

function totalsByCategory(movements: readonly Movement[]): Grouped[] {
  const groups = new Map<string, Grouped>()
  for (const m of movements) {
    const group = groups.get(m.category.id)
    groups.set(m.category.id, {
      category: m.category,
      total: group ? addMoney(group.total, m.amount) : m.amount,
    })
  }

  return [...groups.values()].sort(
    (a, b) =>
      b.total.amount - a.total.amount || compareCategoryNames(a.category.name, b.category.name),
  )
}

function sum(list: readonly Money[], currency: Currency): Money {
  return list.reduce(addMoney, { amount: 0, currency })
}

function withShares(groups: readonly Grouped[], kindTotal: Money): CategoryTotal[] {
  return groups.map((g) => ({ ...g, share: g.total.amount / kindTotal.amount }))
}

/** A share between 0 and 1 as a whole percentage: "34%", or "<1%" when it rounds to zero. */
export function formatShare(share: number): string {
  const percent = Math.round(share * 100)
  return percent === 0 && share > 0 ? '<1%' : `${percent}%`
}
