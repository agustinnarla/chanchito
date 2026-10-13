import type { IsoDate } from '../dates'
import type { Money } from '../money'

/** A bitcoin amount in satoshis: an integer, like cents (spec 010). */
export type Sats = number

export const SATS_PER_BTC = 100_000_000

/** A bitcoin purchase: how much, what it cost and where. */
export type CryptoPurchase = {
  id: string
  quantity: Sats
  cost: Money
  platform: string
  occurredOn: IsoDate
}

export type CryptoPurchaseInput = Omit<CryptoPurchase, 'id'>

/** What is held, what it cost and what it's worth today. */
export type Holding = {
  quantity: Sats
  /** Everything paid. */
  invested: Money
  /** At today's price; null without a price. */
  value: Money | null
  /** Value minus invested; negative on a loss. Null without a price. */
  gain: Money | null
  /** Gain over invested. Null without a price or without purchases. */
  gainRatio: number | null
  /** What one bitcoin cost on average. Null without purchases. */
  averagePrice: Money | null
}
