import { describe, expect, it } from 'vitest'
import { investedThisMonth, summarizeHolding } from './holding'
import type { CryptoPurchase } from './types'

let seq = 0
function purchase(quantity: number, cost: number, occurredOn = '2026-10-05'): CryptoPurchase {
  seq += 1
  return {
    id: `p-${seq}`,
    quantity,
    cost: { amount: cost, currency: 'ARS' },
    platform: 'Binance',
    occurredOn,
  }
}

const ars = (amount: number) => ({ amount, currency: 'ARS' }) as const

describe('summarizeHolding', () => {
  const purchases = [
    purchase(400000, 26000000),
    purchase(500000, 41000000),
    purchase(350000, 78000000),
  ]

  it('adds what was bought and paid, and values it at the price of today', () => {
    expect(summarizeHolding(purchases, ars(13269720200))).toEqual({
      quantity: 1250000,
      invested: ars(145000000),
      value: ars(165871503),
      gain: ars(20871503),
      gainRatio: 20871503 / 145000000,
      averagePrice: ars(11600000000),
    })
  })

  it('without a price, keeps the quantity and what was invested', () => {
    expect(summarizeHolding(purchases, null)).toMatchObject({
      quantity: 1250000,
      invested: ars(145000000),
      value: null,
      gain: null,
      gainRatio: null,
    })
  })

  it('reports a loss as a negative gain', () => {
    const holding = summarizeHolding([purchase(100000000, 15000000000)], ars(13269720200))
    expect(holding.gain).toEqual(ars(-1730279800))
    expect(holding.gainRatio).toBeLessThan(0)
  })

  it('with one purchase, the average price is that purchase', () => {
    expect(summarizeHolding([purchase(350000, 49000000)], null).averagePrice).toEqual(
      ars(14000000000),
    )
  })

  it('is all zero without purchases', () => {
    expect(summarizeHolding([], ars(13269720200))).toEqual({
      quantity: 0,
      invested: ars(0),
      value: ars(0),
      gain: ars(0),
      gainRatio: null,
      averagePrice: null,
    })
  })
})

describe('investedThisMonth', () => {
  it("adds the month's purchases, per currency", () => {
    const invested = investedThisMonth(
      [
        purchase(1, 5000, '2026-10-01'),
        purchase(1, 7000, '2026-10-31'),
        purchase(1, 9000, '2026-09-30'),
      ],
      '2026-10',
    )
    expect(invested).toEqual({ ARS: ars(12000), USD: { amount: 0, currency: 'USD' } })
  })
})
