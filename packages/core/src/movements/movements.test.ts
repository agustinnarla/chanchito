import { describe, expect, it } from 'vitest'
import { filterMovements, formatMovementAmount, sortMovements } from './movements'
import type { Movement } from './types'

const categories = {
  super: { id: 'c-super', name: 'Supermercado', kind: 'expense', archived: false },
  salidas: { id: 'c-salidas', name: 'Salidas', kind: 'expense', archived: true },
  sueldo: { id: 'c-sueldo', name: 'Sueldo', kind: 'income', archived: false },
} as const

let seq = 0
function movement(overrides: Partial<Movement> & Pick<Movement, 'category'>): Movement {
  seq += 1
  return {
    id: `m-${seq}`,
    amount: { amount: 1000, currency: 'ARS' },
    occurredOn: '2026-10-07',
    description: null,
    createdAt: `2026-10-07T12:00:${String(seq).padStart(2, '0')}.000000+00:00`,
    ...overrides,
  }
}

describe('formatMovementAmount', () => {
  it('shows expenses as negative', () => {
    const m = movement({ category: categories.super, amount: { amount: 123456, currency: 'ARS' } })
    expect(formatMovementAmount(m)).toBe('-$ 1.234,56')
  })

  it('shows income with a plus sign', () => {
    const m = movement({ category: categories.sueldo, amount: { amount: 10000, currency: 'USD' } })
    expect(formatMovementAmount(m)).toBe('+US$ 100,00')
  })
})

describe('sortMovements', () => {
  it('sorts by date descending, then by the last created first', () => {
    const older = movement({ category: categories.super, occurredOn: '2026-10-01' })
    const sameDayFirst = movement({ category: categories.super, occurredOn: '2026-10-07' })
    const sameDaySecond = movement({ category: categories.super, occurredOn: '2026-10-07' })
    const newest = movement({ category: categories.super, occurredOn: '2026-10-20' })

    const sorted = sortMovements([older, sameDayFirst, newest, sameDaySecond])

    expect(sorted.map((m) => m.id)).toEqual(
      [newest, sameDaySecond, sameDayFirst, older].map((m) => m.id),
    )
  })

  it('does not mutate the original list', () => {
    const list = [
      movement({ category: categories.super, occurredOn: '2026-10-01' }),
      movement({ category: categories.super, occurredOn: '2026-10-02' }),
    ]
    const ids = list.map((m) => m.id)
    sortMovements(list)
    expect(list.map((m) => m.id)).toEqual(ids)
  })
})

describe('filterMovements', () => {
  const superArs = movement({ category: categories.super })
  const superUsd = movement({
    category: categories.super,
    amount: { amount: 500, currency: 'USD' },
  })
  const salidas = movement({ category: categories.salidas })
  const sueldo = movement({ category: categories.sueldo, amount: { amount: 900, currency: 'USD' } })
  const all = [superArs, superUsd, salidas, sueldo]
  const ids = (list: Movement[]) => list.map((m) => m.id)

  it('returns everything without filters', () => {
    expect(filterMovements(all, {})).toEqual(all)
  })

  it('filters by kind', () => {
    expect(ids(filterMovements(all, { kind: 'expense' }))).toEqual(
      ids([superArs, superUsd, salidas]),
    )
    expect(ids(filterMovements(all, { kind: 'income' }))).toEqual(ids([sueldo]))
  })

  it('filters by category, including archived ones', () => {
    expect(ids(filterMovements(all, { categoryId: 'c-salidas' }))).toEqual(ids([salidas]))
  })

  it('filters by currency', () => {
    expect(ids(filterMovements(all, { currency: 'USD' }))).toEqual(ids([superUsd, sueldo]))
  })

  it('combines filters', () => {
    expect(ids(filterMovements(all, { kind: 'expense', currency: 'USD' }))).toEqual(ids([superUsd]))
    expect(filterMovements(all, { kind: 'income', categoryId: 'c-super' })).toEqual([])
  })
})
