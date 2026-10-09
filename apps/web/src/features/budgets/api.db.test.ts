import type { BudgetInput, Category } from '@chanchito/core'
import type { TestCredentials } from '@chanchito/supabase/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createCategory, deleteCategory } from '@/features/categories/api'
import { createMovement } from '@/features/movements/api'
import { supabase } from '@/lib/supabase'
import { cleanUpUsers, otherUserClient, signInAsNewUser } from '@/test/db'
import { copyBudgets, createBudget, deleteBudget, listBudgets, updateBudgetAmount } from './api'

let user: TestCredentials | undefined
let supermercado: Category
let transporte: Category
let sueldo: Category

beforeEach(async () => {
  user = await signInAsNewUser()
  supermercado = await createCategory({ name: 'Supermercado', kind: 'expense' })
  transporte = await createCategory({ name: 'Transporte', kind: 'expense' })
  sueldo = await createCategory({ name: 'Sueldo', kind: 'income' })
})

afterEach(async () => {
  await cleanUpUsers(user)
  user = undefined
})

const input = (overrides: Partial<BudgetInput> = {}): BudgetInput => ({
  categoryId: supermercado.id,
  month: '2026-10',
  amount: { amount: 6000000, currency: 'ARS' },
  ...overrides,
})

describe('createBudget', () => {
  it('stores the budget and returns it with its category', async () => {
    expect(await createBudget(input())).toEqual({
      id: expect.any(String),
      month: '2026-10',
      amount: { amount: 6000000, currency: 'ARS' },
      category: { id: supermercado.id, name: 'Supermercado', archived: false },
    })
  })

  it('keeps large amounts exact', async () => {
    const budget = await createBudget(
      input({ amount: { amount: Number.MAX_SAFE_INTEGER, currency: 'USD' } }),
    )

    expect(budget.amount).toEqual({ amount: Number.MAX_SAFE_INTEGER, currency: 'USD' })
  })

  it('rejects a second budget for the same category, month and currency', async () => {
    await createBudget(input())

    await expect(createBudget(input())).rejects.toMatchObject({
      message: 'Ya hay un presupuesto para esa categoría y moneda en este mes.',
      reason: 'duplicate',
    })
    await expect(
      createBudget(input({ amount: { amount: 100, currency: 'USD' } })),
    ).resolves.toBeDefined()
  })

  it('rejects an income category', async () => {
    await expect(createBudget(input({ categoryId: sueldo.id }))).rejects.toMatchObject({
      message: 'La categoría elegida ya no existe. Elegí otra.',
      reason: 'category',
    })
  })

  it("rejects someone else's category", async () => {
    const other = await otherUserClient()
    try {
      const { data } = await other.client
        .from('categories')
        .insert({ name: 'Ajena', kind: 'expense' })
        .select('id')
        .single()

      await expect(createBudget(input({ categoryId: data?.id }))).rejects.toMatchObject({
        reason: 'category',
      })
    } finally {
      await cleanUpUsers(other.credentials)
      user = await signInAsNewUser()
    }
  })

  it('rejects invalid data that skipped form validation', async () => {
    await expect(createBudget(input({ amount: { amount: 0, currency: 'ARS' } }))).rejects.toThrow(
      'Algún dato del presupuesto no es válido. Revisalo y probá de nuevo.',
    )
  })
})

describe('listBudgets', () => {
  it('returns only the budgets of the month', async () => {
    await createBudget(input({ month: '2026-09' }))
    await createBudget(input())
    await createBudget(input({ categoryId: transporte.id }))
    await createBudget(input({ month: '2026-11' }))

    const budgets = await listBudgets('2026-10')

    expect(budgets.map((b) => [b.category.name, b.month]).sort()).toEqual([
      ['Supermercado', '2026-10'],
      ['Transporte', '2026-10'],
    ])
  })

  it('shows when the category was archived', async () => {
    await createBudget(input())
    await createMovement({
      categoryId: supermercado.id,
      amount: { amount: 100, currency: 'ARS' },
      occurredOn: '2026-10-07',
      description: null,
    })
    await deleteCategory(supermercado)

    const [budget] = await listBudgets('2026-10')

    expect(budget?.category).toEqual({ id: supermercado.id, name: 'Supermercado', archived: true })
  })

  it('loses the budgets of a deleted category', async () => {
    await createBudget(input())
    await deleteCategory(supermercado)

    expect(await listBudgets('2026-10')).toEqual([])
  })
})

describe('updateBudgetAmount', () => {
  it('changes only the amount', async () => {
    const budget = await createBudget(input())

    const updated = await updateBudgetAmount(budget.id, { amount: 7500000, currency: 'ARS' })

    expect(updated).toEqual({ ...budget, amount: { amount: 7500000, currency: 'ARS' } })
  })
})

describe('deleteBudget', () => {
  it('deletes the budget', async () => {
    const keep = await createBudget(input())
    const remove = await createBudget(input({ categoryId: transporte.id }))

    await deleteBudget(remove.id)

    expect((await listBudgets('2026-10')).map((b) => b.id)).toEqual([keep.id])
  })
})

describe('copyBudgets', () => {
  it('creates every budget and says how many', async () => {
    const count = await copyBudgets([
      input({ month: '2026-11' }),
      input({ month: '2026-11', categoryId: transporte.id }),
    ])

    expect(count).toBe(2)
    expect(await listBudgets('2026-11')).toHaveLength(2)
  })

  it('does nothing with an empty list', async () => {
    expect(await copyBudgets([])).toBe(0)
  })

  it('creates none if one fails', async () => {
    await createBudget(input({ month: '2026-11', categoryId: transporte.id }))

    await expect(
      copyBudgets([
        input({ month: '2026-11' }),
        input({ month: '2026-11', categoryId: transporte.id }),
      ]),
    ).rejects.toMatchObject({
      message: 'Este mes ya tiene presupuestos. Recargá la página.',
      reason: 'duplicate',
    })
    expect(await listBudgets('2026-11')).toHaveLength(1)
  })
})

describe('without a session', () => {
  it('reports errors in Spanish', async () => {
    const budget = await createBudget(input())
    await supabase.auth.signOut()

    await expect(listBudgets('2026-10')).rejects.toThrow('No se pudieron cargar los presupuestos.')
    await expect(createBudget(input())).rejects.toThrow(
      'No se pudo guardar el presupuesto. Revisá tu conexión y probá de nuevo.',
    )
    await expect(updateBudgetAmount(budget.id, budget.amount)).rejects.toThrow(
      'No se pudo guardar el presupuesto.',
    )
    await expect(deleteBudget(budget.id)).rejects.toThrow(
      'No se pudo eliminar el presupuesto. Probá de nuevo.',
    )
    await expect(copyBudgets([input({ month: '2026-12' })])).rejects.toThrow(
      'No se pudieron copiar los presupuestos. Probá de nuevo.',
    )
  })
})
