import { z } from 'zod'
import { resolveCategoryEmoji } from '../categories'
import { IsoDateSchema } from '../dates'
import { formatMoney, parsePositiveAmount, type Currency, type Money } from '../money'
import { characterCount, normalizeSpaces } from '../text'
import type { ContributionInput, SavingsGoalInput } from './types'

export const GOAL_NAME_MAX_LENGTH = 40

export const GoalNameSchema = z
  .string()
  .transform(normalizeSpaces)
  .pipe(
    z
      .string()
      .min(1, 'Ingresá un nombre.')
      .refine((name) => characterCount(name) <= GOAL_NAME_MAX_LENGTH, {
        message: `El nombre puede tener hasta ${GOAL_NAME_MAX_LENGTH} caracteres.`,
      }),
  )

/** Raw values as typed in the goal form. */
export type GoalFormValues = {
  name: string
  emoji: string
  targetAmount: string
  targetCurrency: Currency
  savingCurrency: Currency
}

export type GoalFormErrors = Partial<Record<keyof GoalFormValues, string>>

export type GoalFormResult =
  { ok: true; data: SavingsGoalInput } | { ok: false; errors: GoalFormErrors }

/** Validates the goal form; every invalid field gets its own message in Spanish. */
export function parseGoalForm(values: GoalFormValues): GoalFormResult {
  const errors: GoalFormErrors = {}

  const name = GoalNameSchema.safeParse(values.name)
  if (!name.success) errors.name = name.error.issues[0]?.message

  const target = parsePositiveAmount(values.targetAmount, values.targetCurrency)
  if (typeof target === 'string') errors.targetAmount = target

  if (!name.success || typeof target === 'string') return { ok: false, errors }

  return {
    ok: true,
    data: {
      name: name.data,
      emoji: resolveCategoryEmoji(values.emoji),
      target,
      savingCurrency: values.savingCurrency,
    },
  }
}

/** Raw values as typed in the contribute or withdraw dialog. */
export type ContributionFormValues = { amount: string; occurredOn: string }

export type ContributionFormErrors = Partial<Record<keyof ContributionFormValues, string>>

export type ContributionFormResult =
  { ok: true; data: ContributionInput } | { ok: false; errors: ContributionFormErrors }

type ContributionContext = {
  goal: { id: string; savingCurrency: Currency }
  /** What the goal has saved now, to cap withdrawals. */
  saved: Money
  kind: 'deposit' | 'withdrawal'
}

/** Validates a contribution: always typed positive; a withdrawal is stored negative. */
export function parseContributionForm(
  values: ContributionFormValues,
  { goal, saved, kind }: ContributionContext,
): ContributionFormResult {
  const errors: ContributionFormErrors = {}

  const amount = parsePositiveAmount(values.amount, goal.savingCurrency)
  if (typeof amount === 'string') {
    errors.amount = amount
  } else if (kind === 'withdrawal' && amount.amount > saved.amount) {
    errors.amount = `No podés retirar más de lo que tenés ahorrado (${formatMoney(saved)}).`
  }

  if (!IsoDateSchema.safeParse(values.occurredOn).success) {
    errors.occurredOn = 'Ingresá una fecha válida.'
  }

  if (typeof amount === 'string' || Object.keys(errors).length > 0) return { ok: false, errors }

  const signed = kind === 'withdrawal' ? -amount.amount : amount.amount
  return {
    ok: true,
    data: {
      goalId: goal.id,
      amount: { amount: signed, currency: goal.savingCurrency },
      occurredOn: values.occurredOn,
    },
  }
}
