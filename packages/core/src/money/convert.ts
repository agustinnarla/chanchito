import { MoneyError } from './errors'
import type { Currency, Money } from './types'

/**
 * How many pesos a dollar is worth, in cents (1 US$ = $ 1.450,00 → 145000), and when (spec 009).
 * The only pair the app converts; never stored, always today's.
 */
export type ExchangeRate = { from: 'USD'; to: 'ARS'; rate: number; at: string; source: 'MEP' }

const DECIMAL = /^(\d+)(?:\.(\d+))?$/
const MAX = BigInt(Number.MAX_SAFE_INTEGER)

/**
 * A decimal from an API ("1542.9", "82527.61000000") in integer cents, rounding half up from the
 * third decimal. Works on the text only, never with floats.
 */
export function decimalToCents(value: string): number {
  const match = DECIMAL.exec(value)
  if (!match) throw new RangeError(`Not a positive decimal: ${JSON.stringify(value)}`)
  const [, integerPart = '', decimals = ''] = match
  const cents = BigInt(integerPart + decimals.slice(0, 2).padEnd(2, '0'))
  const rounded = (decimals[2] ?? '0') >= '5' ? cents + 1n : cents
  if (rounded > MAX) throw new RangeError(`Too large to be exact: ${value}`)
  return Number(rounded)
}

/** n / d rounded to the nearest integer, halves away from zero. `d` is positive. */
function roundedDivision(n: bigint, d: bigint): bigint {
  const sign = n < 0n ? -1n : 1n
  const absolute = n < 0n ? -n : n
  return sign * ((absolute * 2n + d) / (2n * d))
}

/** Converts with an explicit rate, in integer cents. Pesos and dollars never mix without one. */
export function convertMoney(money: Money, to: Currency, { rate }: ExchangeRate): Money {
  if (money.currency === to) return money
  const amount =
    to === 'ARS'
      ? roundedDivision(BigInt(money.amount) * BigInt(rate), 100n)
      : roundedDivision(BigInt(money.amount) * 100n, BigInt(rate))
  if (amount > MAX || amount < -MAX) {
    throw new MoneyError('too_large', 'El monto es demasiado grande.')
  }
  return { amount: Number(amount), currency: to }
}
