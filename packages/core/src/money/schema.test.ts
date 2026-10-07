import { describe, expect, it } from 'vitest'
import { CurrencySchema, MoneySchema } from './schema'

describe('CurrencySchema', () => {
  it('accepts ARS and USD', () => {
    expect(CurrencySchema.parse('ARS')).toBe('ARS')
    expect(CurrencySchema.parse('USD')).toBe('USD')
  })

  it('rejects other currencies', () => {
    expect(CurrencySchema.safeParse('EUR').success).toBe(false)
    expect(CurrencySchema.safeParse('ars').success).toBe(false)
  })
})

describe('MoneySchema', () => {
  it('accepts integer cents with a currency', () => {
    expect(MoneySchema.parse({ amount: 123456, currency: 'ARS' })).toEqual({
      amount: 123456,
      currency: 'ARS',
    })
  })

  it('accepts zero and negative amounts', () => {
    expect(MoneySchema.safeParse({ amount: 0, currency: 'USD' }).success).toBe(true)
    expect(MoneySchema.safeParse({ amount: -500, currency: 'USD' }).success).toBe(true)
  })

  it('rejects non-integer amounts', () => {
    expect(MoneySchema.safeParse({ amount: 12.5, currency: 'ARS' }).success).toBe(false)
  })

  it('rejects amounts beyond the safe integer range', () => {
    expect(
      MoneySchema.safeParse({ amount: Number.MAX_SAFE_INTEGER + 1, currency: 'ARS' }).success,
    ).toBe(false)
  })

  it('rejects a missing or invalid currency', () => {
    expect(MoneySchema.safeParse({ amount: 100 }).success).toBe(false)
    expect(MoneySchema.safeParse({ amount: 100, currency: 'EUR' }).success).toBe(false)
  })
})
