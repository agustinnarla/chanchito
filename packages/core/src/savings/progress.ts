import { monthOf, type Month } from '../dates'
import { convertMoney, sumByCurrency, type ExchangeRate } from '../money'
import type { Contribution, GoalProgress, SavingsGoal } from './types'

/** How a goal is going: what was saved, its target in the saving currency and what is left. */
export function goalProgress(
  goal: SavingsGoal,
  contributions: readonly Contribution[],
  rate: ExchangeRate | null,
): GoalProgress {
  const saved = sumByCurrency(
    contributions.filter((c) => c.goalId === goal.id).map((c) => c.amount),
  )[goal.savingCurrency]
  const target =
    goal.target.currency === goal.savingCurrency
      ? goal.target
      : rate && convertMoney(goal.target, goal.savingCurrency, rate)

  if (!target) return { goal, saved, target: null, remaining: null, ratio: null, reached: false }

  return {
    goal,
    saved,
    target,
    remaining: { amount: Math.max(0, target.amount - saved.amount), currency: saved.currency },
    ratio: saved.amount / target.amount,
    reached: saved.amount >= target.amount,
  }
}

/** The month's contributions minus its withdrawals, per currency. Not an expense. */
export function savedThisMonth(contributions: readonly Contribution[], month: Month) {
  return sumByCurrency(
    contributions.filter((c) => monthOf(c.occurredOn) === month).map((c) => c.amount),
  )
}

/** Everything saved so far, in every goal, per currency. */
export function savedByCurrency(contributions: readonly Contribution[]) {
  return sumByCurrency(contributions.map((c) => c.amount))
}
