import { describe, expect, it } from 'vitest'
import { convertMoney, decimalToCents, type ExchangeRate } from './convert'
import { MoneyError } from './errors'

const mep: ExchangeRate = {
  from: 'USD',
  to: 'ARS',
  rate: 145000,
  at: '2026-10-12T14:20:00.000Z',
  source: 'MEP',
}

describe('decimalToCents', () => {
  it.each([
    ['1450', 145000],
    ['1542.9', 154290],
    ['1450.55', 145055],
    ['82527.61000000', 8252761],
    ['132697202.00000000', 13269720200],
    ['0.004', 0],
    ['0.005', 1],
    ['1542.894', 154289],
    ['1542.895', 154290],
  ])('%s → %i', (value, cents) => {
    expect(decimalToCents(value)).toBe(cents)
  })

  it.each(['', ' ', '-1450', 'abc', '1.450,5', '1e3', '.5', '5.', 'NaN', '99999999999999999'])(
    'rejects %j',
    (value) => {
      expect(() => decimalToCents(value)).toThrow(RangeError)
    },
  )
})

describe('convertMoney', () => {
  it('converts dollars to pesos with the rate', () => {
    expect(convertMoney({ amount: 80000, currency: 'USD' }, 'ARS', mep)).toEqual({
      amount: 116000000,
      currency: 'ARS',
    })
  })

  it('converts pesos to dollars, rounding to the cent', () => {
    expect(convertMoney({ amount: 8000000, currency: 'ARS' }, 'USD', mep)).toEqual({
      amount: 5517, // 80.000 / 1.450 = 55,1724…
      currency: 'USD',
    })
  })

  it('rounds half away from zero, also for negative amounts', () => {
    const rate: ExchangeRate = { ...mep, rate: 150 } // $ 1,50 per dollar
    expect(convertMoney({ amount: 1, currency: 'USD' }, 'ARS', rate).amount).toBe(2) // 1,5
    expect(convertMoney({ amount: -1, currency: 'USD' }, 'ARS', rate).amount).toBe(-2)
  })

  it('returns the same money when it is already in that currency', () => {
    const money = { amount: 123, currency: 'ARS' } as const
    expect(convertMoney(money, 'ARS', mep)).toBe(money)
  })

  it('stays exact with large amounts and rejects results too large to be exact', () => {
    expect(convertMoney({ amount: 1_000_000_000_000, currency: 'USD' }, 'ARS', mep).amount).toBe(
      1_450_000_000_000_000,
    )
    expect(() => convertMoney({ amount: 9_000_000_000_000, currency: 'USD' }, 'ARS', mep)).toThrow(
      MoneyError,
    )
  })
})
