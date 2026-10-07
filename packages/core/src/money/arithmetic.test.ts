import { describe, expect, it } from 'vitest'
import { addMoney, sumByCurrency } from './arithmetic'
import type { Money } from './types'

const ars = (amount: number): Money => ({ amount, currency: 'ARS' })
const usd = (amount: number): Money => ({ amount, currency: 'USD' })

describe('addMoney', () => {
  it('adds two amounts of the same currency', () => {
    expect(addMoney(ars(123456), ars(44))).toEqual(ars(123500))
    expect(addMoney(usd(100), usd(-250))).toEqual(usd(-150))
  })

  it('throws when currencies differ', () => {
    expect(() => addMoney(ars(100), usd(100))).toThrow(
      expect.objectContaining({ name: 'MoneyError', code: 'currency_mismatch' }),
    )
  })

  it('throws when the result exceeds the safe integer range', () => {
    expect(() => addMoney(ars(Number.MAX_SAFE_INTEGER), ars(1))).toThrow(
      expect.objectContaining({ code: 'too_large' }),
    )
  })
})

describe('sumByCurrency', () => {
  it('returns both currencies in zero for an empty list', () => {
    expect(sumByCurrency([])).toEqual({ ARS: ars(0), USD: usd(0) })
  })

  it('returns zero for a currency with no amounts', () => {
    expect(sumByCurrency([ars(100), ars(250)])).toEqual({ ARS: ars(350), USD: usd(0) })
  })

  it('groups and sums by currency without mixing them', () => {
    expect(sumByCurrency([ars(100), usd(5000), ars(-30), usd(1)])).toEqual({
      ARS: ars(70),
      USD: usd(5001),
    })
  })
})
