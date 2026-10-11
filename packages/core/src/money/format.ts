import type { Currency, Money } from './types'

const SYMBOLS: Record<Currency, string> = {
  ARS: '$',
  USD: 'US$',
}

/**
 * Formats cents in Argentine style: "$ 1.234,56", "US$ 1.234,56", "-$ 1.234,56".
 * Built with string operations instead of Intl so the output is identical in every runtime.
 */
export function formatMoney({ amount, currency }: Money): string {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`Money amount must be an integer number of cents, got ${amount}`)
  }

  const digits = String(Math.abs(amount)).padStart(3, '0')
  const integerPart = digits.slice(0, -2).replace(/\B(?=(\d{3})+$)/g, '.')
  const cents = digits.slice(-2)
  const sign = amount < 0 ? '-' : ''

  return `${sign}${SYMBOLS[currency]} ${integerPart},${cents}`
}

/** Like `formatMoney`, with a plus sign on positive amounts: "+$ 1.234,56", "-$ 50,00", "$ 0,00". */
export function formatSignedMoney(money: Money): string {
  const formatted = formatMoney(money)
  return money.amount > 0 ? `+${formatted}` : formatted
}
