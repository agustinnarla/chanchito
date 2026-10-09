import type { Currency, Money } from '../money'
import type { MovementCategory } from '../movements'

export type CategoryTotal = {
  category: MovementCategory
  /** Always greater than zero. */
  total: Money
  /** The category's total over the total of its kind in that currency, between 0 and 1. */
  share: number
}

export type CurrencySummary = {
  income: Money
  expense: Money
  /** Income minus expenses; can be negative. */
  net: Money
  /** From the largest total to the smallest; on the same total, by name. */
  incomeByCategory: CategoryTotal[]
  expenseByCategory: CategoryTotal[]
}

/** A month's summary, one per currency. Pesos and dollars are never added together. */
export type MonthSummary = Record<Currency, CurrencySummary>
