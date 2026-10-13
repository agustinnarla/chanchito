import { IsoDateSchema, type IsoDate } from '../dates'
import { parsePositiveAmount } from '../money'
import { characterCount, normalizeSpaces } from '../text'
import { parseBtc } from './btc'
import type { CryptoPurchaseInput } from './types'

export const PLATFORM_MAX_LENGTH = 30

/** Raw values as typed in the purchase dialog. Purchases are paid in pesos. */
export type PurchaseFormValues = {
  quantity: string
  cost: string
  occurredOn: string
  platform: string
}

export type PurchaseFormErrors = Partial<Record<keyof PurchaseFormValues, string>>

export type PurchaseFormResult =
  { ok: true; data: CryptoPurchaseInput } | { ok: false; errors: PurchaseFormErrors }

/** Validates a purchase; every invalid field gets its own message in Spanish. */
export function parsePurchaseForm(values: PurchaseFormValues, today: IsoDate): PurchaseFormResult {
  const errors: PurchaseFormErrors = {}

  const quantity = parseBtc(values.quantity)
  if (typeof quantity === 'string') errors.quantity = quantity

  const cost = parsePositiveAmount(values.cost, 'ARS')
  if (typeof cost === 'string') errors.cost = cost

  if (!IsoDateSchema.safeParse(values.occurredOn).success) {
    errors.occurredOn = 'Ingresá una fecha válida.'
  } else if (values.occurredOn > today) {
    errors.occurredOn = 'La fecha no puede ser futura.'
  }

  const platform = normalizeSpaces(values.platform)
  if (platform === '') {
    errors.platform = 'Ingresá la plataforma.'
  } else if (characterCount(platform) > PLATFORM_MAX_LENGTH) {
    errors.platform = `La plataforma puede tener hasta ${PLATFORM_MAX_LENGTH} caracteres.`
  }

  if (typeof quantity === 'string' || typeof cost === 'string' || Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }
  return { ok: true, data: { quantity, cost, occurredOn: values.occurredOn, platform } }
}
