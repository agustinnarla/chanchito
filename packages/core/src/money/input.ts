import { MoneyError } from './errors'
import { parseMoney } from './parse'
import type { Currency, Money } from './types'

/**
 * Cents as editable text for a form field: "1234,56", or "100" when there are no cents.
 * No thousands separators, so it's easy to edit; `parseMoney` reads it back.
 */
export function formatAmountForInput(cents: number): string {
  const digits = String(Math.abs(cents)).padStart(3, '0')
  const integerPart = digits.slice(0, -2)
  const decimals = digits.slice(-2)
  return decimals === '00' ? integerPart : `${integerPart},${decimals}`
}

/** Parses an amount typed in a form that must be greater than zero, or returns the error message. */
export function parsePositiveAmount(text: string, currency: Currency): Money | string {
  let money: Money
  try {
    money = parseMoney(text, currency)
  } catch (error) {
    if (error instanceof MoneyError) return error.message
    throw error
  }
  return money.amount > 0 ? money : 'El monto tiene que ser mayor a 0.'
}
