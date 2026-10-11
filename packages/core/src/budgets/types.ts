import type { Month } from '../dates'
import type { Money } from '../money'
import type { MovementCategory } from '../movements'

/** A monthly spending limit for an expense category, in one currency. */
export type Budget = {
  id: string
  month: Month
  /** The limit, always positive. */
  amount: Money
  category: Pick<MovementCategory, 'id' | 'name' | 'archived'>
}

/** What is needed to create a budget. Only the amount can change later. */
export type BudgetInput = {
  categoryId: string
  month: Month
  amount: Money
}

/** Under 80%, from 80% to 100% (inclusive), or over the limit. */
export type BudgetStatus = 'ok' | 'warning' | 'exceeded'

export type BudgetProgress = {
  budget: Budget
  /** The month's expenses in the budget's category and currency. */
  spent: Money
  /** Limit minus spent; negative when exceeded. */
  remaining: Money
  /** Spent over the limit; can go over 1. */
  ratio: number
  status: BudgetStatus
}

export type CurrencyBudgets = {
  /** Sum of the limits. */
  budgeted: Money
  /** Sum of what was spent in the budgeted categories. */
  spent: Money
  /** Expenses in categories without a budget in this currency. */
  unbudgetedSpent: Money
  /** Sorted by category name. */
  progress: BudgetProgress[]
}
