import type { Currency } from '@chanchito/core'

export const CURRENCY_LABEL: Record<Currency, string> = { ARS: 'Pesos', USD: 'Dólares' }

const NAME_MAX_LENGTH = 16

/** Shortens a category name to fit the chart's axis; the full name is in the tooltip. */
export function shortenName(name: string): string {
  return name.length > NAME_MAX_LENGTH ? `${name.slice(0, NAME_MAX_LENGTH - 1).trimEnd()}…` : name
}
