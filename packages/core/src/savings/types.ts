import type { IsoDate } from '../dates'
import type { Currency, Money } from '../money'

/** Money set aside for something concrete (spec 009). */
export type SavingsGoal = {
  id: string
  name: string
  /** A key from CATEGORY_EMOJIS; show it through `resolveCategoryEmoji`. */
  emoji: string
  /** What it costs; can be in another currency than the savings ("US$ 800"). */
  target: Money
  /** The currency the money is saved in. */
  savingCurrency: Currency
  archived: boolean
}

/** What is needed to create a goal. */
export type SavingsGoalInput = Pick<SavingsGoal, 'name' | 'emoji' | 'target' | 'savingCurrency'>

/** Money put into a goal (positive) or taken out (negative), in its saving currency. */
export type Contribution = {
  id: string
  goalId: string
  amount: Money
  occurredOn: IsoDate
}

export type ContributionInput = Omit<Contribution, 'id'>

export type GoalProgress = {
  goal: SavingsGoal
  /** Contributions minus withdrawals, in the saving currency. */
  saved: Money
  /** The target in the saving currency; null when it needs a rate and there is none. */
  target: Money | null
  /** What is still missing, never below zero; null without a target. */
  remaining: Money | null
  /** Saved over target; can go over 1. Null without a target. */
  ratio: number | null
  reached: boolean
}
