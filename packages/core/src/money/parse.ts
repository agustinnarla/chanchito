import { MoneyError } from './errors'
import type { Currency, Money } from './types'

const DIGITS = /^[0-9]+$/
const ALLOWED_CHARS = /^[0-9.,]+$/
/** Integer part with dot thousands separators: "1.234", "12.345.678". */
const GROUPED_THOUSANDS = /^[0-9]{1,3}(\.[0-9]{3})+$/

const invalidFormat = () =>
  new MoneyError('invalid_format', 'El monto no es válido. Usá el formato 1.234,56.')

/**
 * Parses a user-typed amount into integer cents. Works on the string only, never with floats.
 *
 * Separator rule:
 * - A comma is always the decimal separator ("1234,5"). Dots before it are thousands ("1.234,56").
 * - Without a comma, dots are thousands when the first group has 1-3 digits and every other group
 *   has exactly 3 ("1.234", "1.234.567"). Otherwise a single dot is decimal ("1234.5").
 * - Both separators in US order ("1,234.56") are rejected.
 */
export function parseMoney(input: string, currency: Currency): Money {
  const text = input.trim()

  if (text === '') {
    throw new MoneyError('empty', 'Ingresá un monto.')
  }
  if (text.startsWith('-')) {
    throw new MoneyError('negative', 'El monto no puede ser negativo.')
  }
  if (!ALLOWED_CHARS.test(text)) {
    throw invalidFormat()
  }

  const { integerPart, decimalPart } = splitParts(text)

  if (!DIGITS.test(integerPart)) {
    throw invalidFormat()
  }
  if (decimalPart !== undefined) {
    if (!DIGITS.test(decimalPart)) {
      throw invalidFormat()
    }
    if (decimalPart.length > 2) {
      throw new MoneyError('too_many_decimals', 'El monto puede tener hasta 2 decimales.')
    }
  }

  const amount = Number(integerPart + (decimalPart ?? '').padEnd(2, '0'))
  if (!Number.isSafeInteger(amount)) {
    throw new MoneyError('too_large', 'El monto es demasiado grande.')
  }

  return { amount, currency }
}

/** Splits into integer digits (thousands separators removed) and raw decimal digits, if any. */
function splitParts(text: string): { integerPart: string; decimalPart?: string } {
  const commaParts = text.split(',')

  if (commaParts.length > 2) {
    throw invalidFormat()
  }

  if (commaParts.length === 2) {
    const [integerText = '', decimalPart = ''] = commaParts
    if (!DIGITS.test(integerText) && !GROUPED_THOUSANDS.test(integerText)) {
      throw invalidFormat()
    }
    return { integerPart: integerText.replaceAll('.', ''), decimalPart }
  }

  if (GROUPED_THOUSANDS.test(text)) {
    return { integerPart: text.replaceAll('.', '') }
  }

  const dotParts = text.split('.')
  if (dotParts.length > 2) {
    throw invalidFormat()
  }
  const [integerPart = '', decimalPart] = dotParts
  return decimalPart === undefined ? { integerPart } : { integerPart, decimalPart }
}
