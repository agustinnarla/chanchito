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
