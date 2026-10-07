import { describe, expect, it } from 'vitest'
import { formatMoney } from './format'

describe('formatMoney', () => {
  it.each([
    [123456, '$ 1.234,56'],
    [0, '$ 0,00'],
    [5, '$ 0,05'],
    [50, '$ 0,50'],
    [100, '$ 1,00'],
    [99999, '$ 999,99'],
    [100000, '$ 1.000,00'],
    [100_000_000_000, '$ 1.000.000.000,00'],
    [Number.MAX_SAFE_INTEGER, '$ 90.071.992.547.409,91'],
  ])('ARS %i → %s', (amount, expected) => {
    expect(formatMoney({ amount, currency: 'ARS' })).toBe(expected)
  })

  it.each([
    [123456, 'US$ 1.234,56'],
    [0, 'US$ 0,00'],
  ])('USD %i → %s', (amount, expected) => {
    expect(formatMoney({ amount, currency: 'USD' })).toBe(expected)
  })

  it.each([
    [-123456, 'ARS', '-$ 1.234,56'],
    [-5, 'ARS', '-$ 0,05'],
    [-100, 'USD', '-US$ 1,00'],
  ] as const)('negative %i %s → %s', (amount, currency, expected) => {
    expect(formatMoney({ amount, currency })).toBe(expected)
  })

  it('rejects non-integer amounts', () => {
    expect(() => formatMoney({ amount: 12.5, currency: 'ARS' })).toThrow()
  })

  it('uses a regular space after the symbol', () => {
    expect(formatMoney({ amount: 100, currency: 'ARS' }).charAt(1)).toBe(' ')
  })
})
