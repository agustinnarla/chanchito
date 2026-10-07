import { z } from 'zod'

export const CURRENCIES = ['ARS', 'USD'] as const

export const CurrencySchema = z.enum(CURRENCIES)

/** Integer amount in cents (within the safe integer range) plus its currency. */
export const MoneySchema = z.object({
  amount: z.int(),
  currency: CurrencySchema,
})
