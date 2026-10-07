import type { z } from 'zod'
import type { CurrencySchema, MoneySchema } from './schema'

export type Currency = z.infer<typeof CurrencySchema>

export type Money = z.infer<typeof MoneySchema>
