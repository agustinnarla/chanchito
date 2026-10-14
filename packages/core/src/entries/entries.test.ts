import { describe, expect, it } from 'vitest'
import type { CryptoPurchase } from '../investments'
import type { Movement, MovementCategory } from '../movements'
import type { Contribution } from '../savings'
import { filterEntries, formatEntryAmount, groupEntriesByDay, monthEntries } from './entries'

const sueldo: MovementCategory = {
  id: 'c-sueldo',
  name: 'Sueldo',
  kind: 'income',
  archived: false,
  emoji: 'briefcase',
}
const super_: MovementCategory = {
  id: 'c-super',
  name: 'Supermercado',
  kind: 'expense',
  archived: false,
  emoji: 'shopping_cart',
}
const phone = { id: 'g-phone', name: 'Celular nuevo', emoji: 'mobile_phone' }

const movement = (
  id: string,
  category: MovementCategory,
  amount: number,
  occurredOn: string,
  createdAt = `${occurredOn}T12:00:00Z`,
): Movement => ({
  id,
  category,
  amount: { amount, currency: 'ARS' },
  occurredOn,
  description: null,
  createdAt,
})
const contribution = (
  id: string,
  amount: number,
  occurredOn: string,
  currency: 'ARS' | 'USD' = 'ARS',
): Contribution => ({
  id,
  goalId: phone.id,
  amount: { amount, currency },
  occurredOn,
})
const purchase = (id: string, cost: number, occurredOn: string): CryptoPurchase => ({
  id,
  quantity: 100000,
  cost: { amount: cost, currency: 'ARS' },
  platform: 'Binance',
  occurredOn,
})

const data = {
  movements: [
    movement('m-sueldo', sueldo, 300000, '2026-10-01'),
    movement('m-super-1', super_, 4500, '2026-10-07', '2026-10-07T10:00:00Z'),
    movement('m-super-2', super_, 1200, '2026-10-07', '2026-10-07T18:00:00Z'),
    movement('m-sept', super_, 999, '2026-09-30'),
  ],
  contributions: [
    contribution('a-1', 80000, '2026-10-07'),
    contribution('a-2', -10000, '2026-10-12'),
    contribution('a-sept', 5000, '2026-09-15'),
    { ...contribution('a-lost', 100, '2026-10-08'), goalId: 'g-deleted' },
  ],
  goals: [phone],
  purchases: [purchase('p-1', 13200000, '2026-10-07'), purchase('p-sept', 1, '2026-09-01')],
}

const ids = (entries: ReturnType<typeof monthEntries>) =>
  entries.map((e) =>
    e.kind === 'movement' ? e.movement.id : e.kind === 'saving' ? e.contribution.id : e.purchase.id,
  )

describe('monthEntries', () => {
  it("brings the month's movements, contributions and purchases, newest day first", () => {
    expect(ids(monthEntries(data, '2026-10'))).toEqual([
      'a-2',
      // Same day: movements first (last created first), then savings, then investments
      'm-super-2',
      'm-super-1',
      'a-1',
      'p-1',
      'm-sueldo',
    ])
  })

  it('carries the goal of each contribution, and skips those whose goal is gone', () => {
    const saving = monthEntries(data, '2026-10').find((e) => e.kind === 'saving')
    expect(saving).toMatchObject({ kind: 'saving', goal: phone })
    expect(ids(monthEntries(data, '2026-10'))).not.toContain('a-lost')
  })
})

describe('filterEntries', () => {
  const entries = monthEntries(data, '2026-10')

  it('keeps only savings and investments with "set-aside"', () => {
    expect(ids(filterEntries(entries, { kind: 'set-aside' }))).toEqual(['a-2', 'a-1', 'p-1'])
  })

  it('keeps only movements of that kind with "expense" or "income"', () => {
    expect(ids(filterEntries(entries, { kind: 'income' }))).toEqual(['m-sueldo'])
    expect(ids(filterEntries(entries, { kind: 'expense' }))).toEqual(['m-super-2', 'm-super-1'])
  })

  it('keeps only movements of that category', () => {
    expect(ids(filterEntries(entries, { categoryId: 'c-super' }))).toEqual([
      'm-super-2',
      'm-super-1',
    ])
  })

  it('filters every kind of entry by currency', () => {
    const withDollars = monthEntries(
      { ...data, contributions: [contribution('a-usd', 5000, '2026-10-03', 'USD')] },
      '2026-10',
    )
    expect(ids(filterEntries(withDollars, { currency: 'USD' }))).toEqual(['a-usd'])
    expect(ids(filterEntries(withDollars, { currency: 'ARS' }))).not.toContain('a-usd')
  })

  it('keeps everything without filters', () => {
    expect(filterEntries(entries, {})).toEqual(entries)
  })
})

describe('groupEntriesByDay', () => {
  it('groups consecutive entries of the same day, with its label', () => {
    const days = groupEntriesByDay(monthEntries(data, '2026-10'))
    expect(days.map((d) => [d.label, d.entries.length])).toEqual([
      ['Lunes 12 de octubre', 1],
      ['Miércoles 7 de octubre', 4],
      ['Jueves 1 de octubre', 1],
    ])
  })
})

describe('formatEntryAmount', () => {
  const [withdrawal, expense, , deposit, investment, income] = monthEntries(data, '2026-10')

  it('signs what leaves the month with minus and what comes back or in with plus', () => {
    expect(withdrawal && formatEntryAmount(withdrawal)).toBe('+$ 100,00')
    expect(expense && formatEntryAmount(expense)).toBe('-$ 12,00')
    expect(deposit && formatEntryAmount(deposit)).toBe('-$ 800,00')
    expect(investment && formatEntryAmount(investment)).toBe('-$ 132.000,00')
    expect(income && formatEntryAmount(income)).toBe('+$ 3.000,00')
  })
})
