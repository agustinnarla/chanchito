import { z } from 'zod'
import type { Month } from '../dates'
import { parsePositiveAmount, type Currency } from '../money'
import type { BudgetInput } from './types'

/** Raw values as typed in the budget form. The month is the one being viewed. */
export type BudgetFormValues = {
  categoryId: string
  currency: Currency
  amount: string
}

export type BudgetFormErrors = Partial<Record<keyof BudgetFormValues, string>>

export type BudgetFormResult =
  { ok: true; data: BudgetInput } | { ok: false; errors: BudgetFormErrors }

const CategoryIdSchema = z.uuid()

/** Validates the form; every invalid field gets its own message in Spanish. */
export function parseBudgetForm(values: BudgetFormValues, month: Month): BudgetFormResult {
  const errors: BudgetFormErrors = {}

  if (!CategoryIdSchema.safeParse(values.categoryId).success) {
    errors.categoryId = 'Elegí una categoría.'
  }

  const amount = parsePositiveAmount(values.amount, values.currency)
  if (typeof amount === 'string') errors.amount = amount

  if (typeof amount === 'string' || Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, data: { categoryId: values.categoryId, month, amount } }
}
