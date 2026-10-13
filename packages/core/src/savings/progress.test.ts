import { describe, expect, it } from 'vitest'
import type { ExchangeRate } from '../money'
import { goalProgress, savedByCurrency, savedThisMonth } from './progress'
import type { Contribution, SavingsGoal } from './types'

const mep: ExchangeRate = {
  from: 'USD',
  to: 'ARS',
  rate: 145000,
  at: '2026-10-12T14:20:00.000Z',
  source: 'MEP',
}

const phone: SavingsGoal = {
  id: 'g-phone',
  name: 'Celular nuevo',
  emoji: 'mobile_phone',
  target: { amount: 80000, currency: 'USD' }, // US$ 800
  savingCurrency: 'ARS',
  archived: false,
}

let seq = 0
function contribution(amount: number, occurredOn = '2026-10-05', goalId = phone.id): Contribution {
  seq += 1
  return { id: `c-${seq}`, goalId, amount: { amount, currency: 'ARS' }, occurredOn }
}

describe('goalProgress', () => {
  it('converts the target with the rate and says what is left', () => {
    const progress = goalProgress(phone, [contribution(30000000), contribution(15000000)], mep)

    expect(progress.saved).toEqual({ amount: 45000000, currency: 'ARS' })
    expect(progress.target).toEqual({ amount: 116000000, currency: 'ARS' })
    expect(progress.remaining).toEqual({ amount: 71000000, currency: 'ARS' })
    expect(progress.ratio).toBeCloseTo(0.388, 3)
    expect(progress.reached).toBe(false)
  })

  it('subtracts withdrawals and ignores other goals', () => {
    const progress = goalProgress(
      phone,
      [
        contribution(50000000),
        contribution(-10000000),
        contribution(99999, '2026-10-05', 'g-other'),
      ],
      mep,
    )
    expect(progress.saved.amount).toBe(40000000)
  })

  it('needs no rate when the target is in the saving currency', () => {
    const goal: SavingsGoal = { ...phone, target: { amount: 100000000, currency: 'ARS' } }
    const progress = goalProgress(goal, [contribution(100000000)], null)

    expect(progress.target).toEqual({ amount: 100000000, currency: 'ARS' })
    expect(progress.remaining).toEqual({ amount: 0, currency: 'ARS' })
    expect(progress.ratio).toBe(1)
    expect(progress.reached).toBe(true)
  })

  it('without a rate, keeps what was saved and leaves the rest unknown', () => {
    const progress = goalProgress(phone, [contribution(45000000)], null)

    expect(progress.saved.amount).toBe(45000000)
    expect(progress.target).toBeNull()
    expect(progress.remaining).toBeNull()
    expect(progress.ratio).toBeNull()
    expect(progress.reached).toBe(false)
  })

  it('never says less than zero is left once the goal is passed', () => {
    const progress = goalProgress(phone, [contribution(120000000)], mep)
    expect(progress.remaining?.amount).toBe(0)
    expect(progress.reached).toBe(true)
  })

  it('starts at zero without contributions', () => {
    const progress = goalProgress(phone, [], mep)
    expect(progress.saved).toEqual({ amount: 0, currency: 'ARS' })
    expect(progress.ratio).toBe(0)
  })
})

describe('savedThisMonth', () => {
  it("adds the month's contributions and subtracts its withdrawals, per currency", () => {
    const dollars: Contribution = {
      id: 'c-usd',
      goalId: 'g-trip',
      amount: { amount: 5000, currency: 'USD' },
      occurredOn: '2026-10-20',
    }
    const saved = savedThisMonth(
      [
        contribution(8000000, '2026-10-01'),
        contribution(-1000000, '2026-10-31'),
        contribution(5000000, '2026-09-30'),
        dollars,
      ],
      '2026-10',
    )
    expect(saved).toEqual({
      ARS: { amount: 7000000, currency: 'ARS' },
      USD: { amount: 5000, currency: 'USD' },
    })
  })
})

describe('savedByCurrency', () => {
  it('adds everything saved, in every month, per currency', () => {
    expect(savedByCurrency([contribution(100), contribution(-40, '2025-01-01')])).toEqual({
      ARS: { amount: 60, currency: 'ARS' },
      USD: { amount: 0, currency: 'USD' },
    })
  })
})
