import { roundedDivision, toSafeAmount, type Money } from '../money'
import { SATS_PER_BTC, type Sats } from './types'

const QUANTITY = /^(\d+)(?:[.,](\d+))?$/
const DECIMALS = 8
const SATS = BigInt(SATS_PER_BTC)

/**
 * A typed bitcoin amount ("0,0125" or "0.0125") in satoshis, or the error message in Spanish.
 * Works on the text only, never with floats.
 */
export function parseBtc(input: string): Sats | string {
  const text = input.trim()
  if (text === '') return 'Ingresá una cantidad.'
  if (text.startsWith('-')) return 'La cantidad no puede ser negativa.'
  const match = QUANTITY.exec(text)
  if (!match) return 'La cantidad no es válida. Usá el formato 0,0125.'
  const [, whole = '', decimals = ''] = match
  if (decimals.length > DECIMALS) return `La cantidad puede tener hasta ${DECIMALS} decimales.`
  const sats = Number(whole + decimals.padEnd(DECIMALS, '0'))
  if (!Number.isSafeInteger(sats)) return 'La cantidad es demasiado grande.'
  return sats > 0 ? sats : 'La cantidad tiene que ser mayor a 0.'
}

/** Whole and decimal parts, without trailing zeros: 1250000 → ['0', '0125']. */
function split(sats: Sats): [string, string] {
  const digits = String(sats).padStart(DECIMALS + 1, '0')
  return [digits.slice(0, -DECIMALS), digits.slice(-DECIMALS).replace(/0+$/, '')]
}

/** 1250000 → "0,0125 BTC"; 100000000 → "1 BTC". */
export function formatBtc(sats: Sats): string {
  const [whole, decimals] = split(sats)
  const grouped = whole.replace(/\B(?=(\d{3})+$)/g, '.')
  return `${grouped}${decimals ? `,${decimals}` : ''} BTC`
}

/** As typed in the form: 1250000 → "0,0125". */
export function formatBtcForInput(sats: Sats): string {
  const [whole, decimals] = split(sats)
  return decimals ? `${whole},${decimals}` : whole
}

/** What `sats` are worth at `price` (for one bitcoin), rounded to the cent. */
export function valueOf(sats: Sats, price: Money): Money {
  const amount = roundedDivision(BigInt(sats) * BigInt(price.amount), SATS)
  return { amount: toSafeAmount(amount), currency: price.currency }
}

/** What one bitcoin cost in a purchase of `quantity` for `cost`. */
export function purchasePrice(quantity: Sats, cost: Money): Money {
  const amount = roundedDivision(BigInt(cost.amount) * SATS, BigInt(quantity))
  return { amount: toSafeAmount(amount), currency: cost.currency }
}
