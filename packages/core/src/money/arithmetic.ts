import { MoneyError } from './errors'
import type { Currency, Money } from './types'

/** Adds two amounts of the same currency. Never converts between currencies. */
export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new MoneyError('currency_mismatch', 'No se pueden sumar montos de monedas distintas.')
  }

  const amount = a.amount + b.amount
  if (!Number.isSafeInteger(amount)) {
    throw new MoneyError('too_large', 'El monto es demasiado grande.')
  }

  return { amount, currency: a.currency }
}

/** Sums a list per currency. Always returns every currency, in zero when it has no amounts. */
export function sumByCurrency(list: readonly Money[]): Record<Currency, Money> {
  const totals: Record<Currency, Money> = {
    ARS: { amount: 0, currency: 'ARS' },
    USD: { amount: 0, currency: 'USD' },
  }

  for (const money of list) {
    totals[money.currency] = addMoney(totals[money.currency], money)
  }

  return totals
}
