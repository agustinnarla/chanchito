import type { Category, MovementInput } from '@chanchito/core'
import type { TestCredentials } from '@chanchito/supabase/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createCategory, deleteCategory } from '@/features/categories/api'
import { supabase } from '@/lib/supabase'
import { cleanUpUsers, otherUserClient, signInAsNewUser } from '@/test/db'
import { createMovement, deleteMovement, listMovements, updateMovement } from './api'

let user: TestCredentials | undefined
let supermercado: Category
let sueldo: Category

beforeEach(async () => {
  user = await signInAsNewUser()
  supermercado = await createCategory({ name: 'Supermercado', kind: 'expense' })
  sueldo = await createCategory({ name: 'Sueldo', kind: 'income' })
})

afterEach(async () => {
  await cleanUpUsers(user)
  user = undefined
})

const input = (overrides: Partial<MovementInput> = {}): MovementInput => ({
  categoryId: supermercado.id,
  amount: { amount: 123456, currency: 'ARS' },
  occurredOn: '2026-10-07',
  description: 'Compra del mes',
  ...overrides,
})

describe('createMovement', () => {
  it('stores the movement and returns it with its category', async () => {
    const movement = await createMovement(input())

    expect(movement).toEqual({
      id: expect.any(String),
      amount: { amount: 123456, currency: 'ARS' },
      occurredOn: '2026-10-07',
      description: 'Compra del mes',
      createdAt: expect.any(String),
      category: { id: supermercado.id, name: 'Supermercado', kind: 'expense', archived: false },
    })
  })

  it('keeps large amounts exact', async () => {
    const movement = await createMovement(
      input({ amount: { amount: 100_000_000_000, currency: 'USD' } }),
    )

    expect(movement.amount).toEqual({ amount: 100_000_000_000, currency: 'USD' })
  })

  it("rejects someone else's category with a message in Spanish", async () => {
    const other = await otherUserClient()
    try {
      const { data } = await other.client
        .from('categories')
        .insert({ name: 'Ajena', kind: 'expense' })
        .select('id')
        .single()

      await expect(createMovement(input({ categoryId: data?.id }))).rejects.toThrow(
        'La categoría elegida ya no existe. Elegí otra.',
      )
    } finally {
      await cleanUpUsers(other.credentials)
      user = await signInAsNewUser()
    }
  })

  it('rejects invalid data that skipped form validation', async () => {
    await expect(createMovement(input({ amount: { amount: 0, currency: 'ARS' } }))).rejects.toThrow(
      'Algún dato del movimiento no es válido. Revisalo y probá de nuevo.',
    )
  })
})

describe('listMovements', () => {
  it('returns only the movements of the month, including the first and last day', async () => {
    for (const occurredOn of [
      '2026-09-30',
      '2026-10-01',
      '2026-10-15',
      '2026-10-31',
      '2026-11-01',
    ]) {
      await createMovement(input({ occurredOn, description: occurredOn }))
    }

    const dates = (await listMovements('2026-10')).map((m) => m.occurredOn).sort()

    expect(dates).toEqual(['2026-10-01', '2026-10-15', '2026-10-31'])
  })

  it('includes February 29 in a leap year', async () => {
    await createMovement(input({ occurredOn: '2028-02-29' }))

    expect(await listMovements('2028-02')).toHaveLength(1)
    expect(await listMovements('2028-03')).toHaveLength(0)
  })

  it('shows when the category was archived', async () => {
    await createMovement(input())
    await deleteCategory(supermercado)

    const [movement] = await listMovements('2026-10')

    expect(movement?.category).toEqual({ ...supermercado, archived: true })
  })

  it("does not return other users' movements", async () => {
    const other = await otherUserClient()
    try {
      const { data: category } = await other.client
        .from('categories')
        .insert({ name: 'Ajena', kind: 'expense' })
        .select('id')
        .single()
      await other.client.from('movements').insert({
        category_id: category?.id,
        amount: 1,
        currency: 'ARS',
        occurred_on: '2026-10-07',
      })
      await createMovement(input())

      expect(await listMovements('2026-10')).toHaveLength(1)
    } finally {
      await cleanUpUsers(other.credentials)
      user = await signInAsNewUser()
    }
  })
})

describe('updateMovement', () => {
  it('updates every field, including moving it to the other kind and month', async () => {
    const movement = await createMovement(input())

    const updated = await updateMovement(movement.id, {
      categoryId: sueldo.id,
      amount: { amount: 10000, currency: 'USD' },
      occurredOn: '2026-11-02',
      description: null,
    })

    expect(updated).toMatchObject({
      id: movement.id,
      amount: { amount: 10000, currency: 'USD' },
      occurredOn: '2026-11-02',
      description: null,
      category: { id: sueldo.id, kind: 'income' },
    })
    expect(await listMovements('2026-10')).toEqual([])
    expect(await listMovements('2026-11')).toHaveLength(1)
  })

  it('can keep an archived category', async () => {
    const movement = await createMovement(input())
    await deleteCategory(supermercado)

    const updated = await updateMovement(movement.id, input({ description: 'Editado' }))

    expect(updated.description).toBe('Editado')
    expect(updated.category.archived).toBe(true)
  })
})

describe('deleteMovement', () => {
  it('deletes the movement', async () => {
    const keep = await createMovement(input({ description: 'Queda' }))
    const remove = await createMovement(input({ description: 'Se va' }))

    await deleteMovement(remove.id)

    expect((await listMovements('2026-10')).map((m) => m.id)).toEqual([keep.id])
  })
})

describe('without a session', () => {
  it('reports errors in Spanish', async () => {
    const movement = await createMovement(input())
    await supabase.auth.signOut()

    await expect(listMovements('2026-10')).rejects.toThrow('No se pudieron cargar los movimientos.')
    await expect(createMovement(input())).rejects.toThrow(
      'No se pudo guardar el movimiento. Revisá tu conexión y probá de nuevo.',
    )
    await expect(updateMovement(movement.id, input())).rejects.toThrow(
      'No se pudo guardar el movimiento.',
    )
    await expect(deleteMovement(movement.id)).rejects.toThrow(
      'No se pudo eliminar el movimiento. Probá de nuevo.',
    )
  })
})
