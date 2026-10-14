import { compareCategoryNames } from '../categories'
import { weekRange, type Week } from '../dates'
import { CURRENCIES, sumByCurrency, type Currency } from '../money'
import type { Movement } from '../movements'
import { limitProgress } from './budgets'
import type { CurrencyWeeklyBudgets, WeeklyBudget, WeeklyBudgetProgress } from './types'

/** How much of a weekly budget was spent in `week` (Monday to Sunday), and its status. */
export function weeklyBudgetProgress(
  budget: WeeklyBudget,
  movements: readonly Movement[],
  week: Week,
): WeeklyBudgetProgress {
  const { from, to } = weekRange(week)
  const { currency } = budget.amount
  const spent = sumByCurrency(
    movements
      .filter(
        (m) =>
          m.category.kind === 'expense' &&
          m.category.id === budget.category.id &&
          m.amount.currency === currency &&
          m.occurredOn >= from &&
          m.occurredOn < to,
      )
      .map((m) => m.amount),
  )[currency]
  return { budget, ...limitProgress(budget.amount, spent) }
}

/** The weekly budgets of `week` per currency, sorted by category name. */
export function summarizeWeeklyBudgets(
  budgets: readonly WeeklyBudget[],
  movements: readonly Movement[],
  week: Week,
): Record<Currency, CurrencyWeeklyBudgets> {
  const summarize = (currency: Currency): CurrencyWeeklyBudgets => {
    const progress = budgets
      .filter((b) => b.amount.currency === currency)
      .sort((a, b) => compareCategoryNames(a.category.name, b.category.name))
      .map((b) => weeklyBudgetProgress(b, movements, week))
    return {
      budgeted: sumByCurrency(progress.map((p) => p.budget.amount))[currency],
      spent: sumByCurrency(progress.map((p) => p.spent))[currency],
      progress,
    }
  }
  return Object.fromEntries(CURRENCIES.map((c) => [c, summarize(c)])) as Record<
    Currency,
    CurrencyWeeklyBudgets
  >
}
