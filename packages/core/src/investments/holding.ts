import { monthOf, type Month } from '../dates'
import { addMoney, sumByCurrency, type Money } from '../money'
import { purchasePrice, valueOf } from './btc'
import type { CryptoPurchase, Holding } from './types'

/**
 * What is held and how it's going at `price` (one bitcoin, in the purchases' currency).
 * Purchases are all in one currency (pesos): `addMoney` refuses to mix them.
 */
export function summarizeHolding(
  purchases: readonly CryptoPurchase[],
  price: Money | null,
): Holding {
  const currency = price?.currency ?? purchases[0]?.cost.currency ?? 'ARS'
  const quantity = purchases.reduce((total, p) => total + p.quantity, 0)
  const invested = purchases.reduce((total, p) => addMoney(total, p.cost), {
    amount: 0,
    currency,
  } satisfies Money)
  const value = price && valueOf(quantity, price)
  const gain = value && { amount: value.amount - invested.amount, currency }

  return {
    quantity,
    invested,
    value,
    gain,
    gainRatio: gain && invested.amount > 0 ? gain.amount / invested.amount : null,
    averagePrice: quantity > 0 ? purchasePrice(quantity, invested) : null,
  }
}

/** What went into bitcoin in a month, per currency. Not an expense (spec 010). */
export function investedThisMonth(purchases: readonly CryptoPurchase[], month: Month) {
  return sumByCurrency(purchases.filter((p) => monthOf(p.occurredOn) === month).map((p) => p.cost))
}
