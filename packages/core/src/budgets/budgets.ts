import { compareCategoryNames } from '../categories'
import { monthOf, type Month } from '../dates'
import { addMoney, formatMoney, type Currency, type Money } from '../money'
import type { Movement } from '../movements'
import type { Budget, BudgetInput, BudgetProgress, BudgetStatus, CurrencyBudgets } from './types'

const CURRENCIES: Currency[] = ['ARS', 'USD']

/** How much of the budget was spent in its month, and its status. */
export function budgetProgress(budget: Budget, movements: readonly Movement[]): BudgetProgress {
  const { currency } = budget.amount
  const spent = sum(
    movements
      .filter(
        (m) =>
          m.category.kind === 'expense' &&
          m.category.id === budget.category.id &&
          m.amount.currency === currency &&
          monthOf(m.occurredOn) === budget.month,
      )
      .map((m) => m.amount),
    currency,
  )

  return {
    budget,
    spent,
    remaining: addMoney(budget.amount, { amount: -spent.amount, currency }),
    ratio: spent.amount / budget.amount.amount,
    status: statusOf(spent.amount, budget.amount.amount),
  }
}

/** Compares with 80% using BigInt, so huge amounts don't lose precision. */
function statusOf(spent: number, limit: number): BudgetStatus {
  if (spent > limit) return 'exceeded'
  return BigInt(spent) * 5n >= BigInt(limit) * 4n ? 'warning' : 'ok'
}

/** "Quedan $ 15.000,00", "Quedan $ 2.000,00 · Cerca del límite" or "Te pasaste por $ 5.000,00". */
export function formatBudgetStatus({ remaining, status }: BudgetProgress): string {
  if (status === 'exceeded') {
    return `Te pasaste por ${formatMoney({ ...remaining, amount: -remaining.amount })}`
  }
  const left = `Quedan ${formatMoney(remaining)}`
  return status === 'warning' ? `${left} · Cerca del límite` : left
}

/** The month's budgets per currency, with the totals and the expenses without a budget. */
export function summarizeBudgets(
  budgets: readonly Budget[],
  movements: readonly Movement[],
  month: Month,
): Record<Currency, CurrencyBudgets> {
  const monthExpenses = movements.filter(
    (m) => m.category.kind === 'expense' && monthOf(m.occurredOn) === month,
  )

  const summarize = (currency: Currency): CurrencyBudgets => {
    const inCurrency = budgets
      .filter((b) => b.amount.currency === currency)
      .sort((a, b) => compareCategoryNames(a.category.name, b.category.name))
    const progress = inCurrency.map((b) => budgetProgress(b, monthExpenses))
    const budgetedIds = new Set(inCurrency.map((b) => b.category.id))

    return {
      budgeted: sum(
        inCurrency.map((b) => b.amount),
        currency,
      ),
      spent: sum(
        progress.map((p) => p.spent),
        currency,
      ),
      unbudgetedSpent: sum(
        monthExpenses
          .filter((m) => m.amount.currency === currency && !budgetedIds.has(m.category.id))
          .map((m) => m.amount),
        currency,
      ),
      progress,
    }
  }

  return Object.fromEntries(CURRENCIES.map((c) => [c, summarize(c)])) as Record<
    Currency,
    CurrencyBudgets
  >
}

/** The previous month's budgets as inputs for `month`, leaving out archived categories. */
export function budgetsToCopy(previous: readonly Budget[], month: Month): BudgetInput[] {
  return previous
    .filter((b) => !b.category.archived)
    .map((b) => ({ categoryId: b.category.id, month, amount: { ...b.amount } }))
}

function sum(list: readonly Money[], currency: Currency): Money {
  return list.reduce(addMoney, { amount: 0, currency })
}
