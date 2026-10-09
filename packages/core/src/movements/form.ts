import { z } from 'zod'
import { IsoDateSchema } from '../dates'
import { MoneyError, parseMoney, type Currency, type Money } from '../money'
import { characterCount, normalizeSpaces } from '../text'
import type { MovementInput } from './types'

export const MOVEMENT_DESCRIPTION_MAX_LENGTH = 100

/** Raw values as typed in the movement form. */
export type MovementFormValues = {
  amount: string
  currency: Currency
  occurredOn: string
  categoryId: string
  description: string
}

export type MovementFormErrors = Partial<Record<keyof MovementFormValues, string>>

export type MovementFormResult =
  { ok: true; data: MovementInput } | { ok: false; errors: MovementFormErrors }

const CategoryIdSchema = z.uuid()

/** Validates the form; every invalid field gets its own message in Spanish. */
export function parseMovementForm(values: MovementFormValues): MovementFormResult {
  const errors: MovementFormErrors = {}

  const amount = parseAmount(values.amount, values.currency)
  if (typeof amount === 'string') errors.amount = amount

  if (!CategoryIdSchema.safeParse(values.categoryId).success) {
    errors.categoryId = 'Elegí una categoría.'
  }

  if (!IsoDateSchema.safeParse(values.occurredOn).success) {
    errors.occurredOn = 'Ingresá una fecha válida.'
  }

  const description = normalizeSpaces(values.description)
  if (characterCount(description) > MOVEMENT_DESCRIPTION_MAX_LENGTH) {
    errors.description = `La descripción puede tener hasta ${MOVEMENT_DESCRIPTION_MAX_LENGTH} caracteres.`
  }

  if (typeof amount === 'string' || Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    data: {
      amount,
      occurredOn: values.occurredOn,
      categoryId: values.categoryId,
      description: description === '' ? null : description,
    },
  }
}

/** Returns the parsed amount, or an error message. */
function parseAmount(text: string, currency: Currency): Money | string {
  let money: Money
  try {
    money = parseMoney(text, currency)
  } catch (error) {
    if (error instanceof MoneyError) return error.message
    throw error
  }
  return money.amount > 0 ? money : 'El monto tiene que ser mayor a 0.'
}
