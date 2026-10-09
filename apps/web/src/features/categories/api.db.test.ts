import { SUGGESTED_CATEGORIES } from '@chanchito/core'
import type { TestCredentials } from '@chanchito/supabase/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { supabase } from '@/lib/supabase'
import { cleanUpUsers, otherUserClient, signInAsNewUser } from '@/test/db'
import {
  createCategory,
  createSuggestedCategories,
  deleteCategory,
  listCategories,
  renameCategory,
  restoreCategory,
} from './api'
import { CategoryError } from './errors'

let user: TestCredentials | undefined

beforeEach(async () => {
  user = await signInAsNewUser()
})

afterEach(async () => {
  await cleanUpUsers(user)
  user = undefined
})

describe('listCategories', () => {
  it('starts empty', async () => {
    expect(await listCategories()).toEqual([])
  })

  it("only returns the signed-in user's categories", async () => {
    const other = await otherUserClient()
    try {
      await other.client.from('categories').insert({ name: 'Ajena', kind: 'expense' })
      await createCategory({ name: 'Propia', kind: 'expense' })

      expect((await listCategories()).map((c) => c.name)).toEqual(['Propia'])
    } finally {
      await cleanUpUsers(other.credentials)
      user = await signInAsNewUser()
    }
  })

  it('fails with a message in Spanish without a session', async () => {
    await supabase.auth.signOut()

    await expect(listCategories()).rejects.toThrow(
      new CategoryError('No se pudieron cargar las categorías.'),
    )
  })
})

describe('createCategory', () => {
  it('normalizes the name and returns the stored category', async () => {
    const category = await createCategory({ name: '  Café   con leche ', kind: 'expense' })

    expect(category).toEqual({
      id: expect.any(String),
      name: 'Café con leche',
      kind: 'expense',
      archived: false,
    })
    expect(await listCategories()).toEqual([category])
  })

  it('rejects a duplicate name of the same kind, ignoring case', async () => {
    await createCategory({ name: 'Comida', kind: 'expense' })

    await expect(createCategory({ name: 'COMIDA', kind: 'expense' })).rejects.toThrow(
      'Ya existe una categoría de gasto con ese nombre.',
    )
  })

  it('names the kind in the duplicate message', async () => {
    await createCategory({ name: 'Sueldo', kind: 'income' })

    await expect(createCategory({ name: 'sueldo', kind: 'income' })).rejects.toThrow(
      'Ya existe una categoría de ingreso con ese nombre.',
    )
  })

  it('allows the same name with the other kind', async () => {
    await createCategory({ name: 'Otros', kind: 'expense' })

    await expect(createCategory({ name: 'Otros', kind: 'income' })).resolves.toMatchObject({
      name: 'Otros',
      kind: 'income',
    })
  })

  it('validates the name before calling the database', async () => {
    await expect(createCategory({ name: '   ', kind: 'expense' })).rejects.toThrow(
      'Ingresá un nombre.',
    )
    await expect(createCategory({ name: 'a'.repeat(51), kind: 'expense' })).rejects.toThrow(
      'El nombre puede tener hasta 50 caracteres.',
    )
    expect(await listCategories()).toEqual([])
  })
})

describe('renameCategory', () => {
  it('renames and normalizes', async () => {
    const category = await createCategory({ name: 'Salidas', kind: 'expense' })

    const renamed = await renameCategory(category, '  Bares  y  boliches ')

    expect(renamed).toEqual({ ...category, name: 'Bares y boliches' })
    expect(await listCategories()).toEqual([renamed])
  })

  it('rejects renaming to an existing name of the same kind', async () => {
    await createCategory({ name: 'Cine', kind: 'expense' })
    const salidas = await createCategory({ name: 'Salidas', kind: 'expense' })

    await expect(renameCategory(salidas, 'cine')).rejects.toThrow(
      'Ya existe una categoría de gasto con ese nombre.',
    )
  })

  it('validates the new name', async () => {
    const category = await createCategory({ name: 'Salidas', kind: 'expense' })

    await expect(renameCategory(category, '')).rejects.toThrow('Ingresá un nombre.')
  })
})

/** Adds a movement straight to the database, so the category is in use. */
async function addMovement(categoryId: string) {
  const { error } = await supabase.from('movements').insert({
    category_id: categoryId,
    amount: 1000,
    currency: 'ARS',
    occurred_on: '2026-10-07',
  })
  if (error) throw error
}

describe('deleteCategory', () => {
  it('deletes a category without movements', async () => {
    const cine = await createCategory({ name: 'Cine', kind: 'expense' })
    const salidas = await createCategory({ name: 'Salidas', kind: 'expense' })

    expect(await deleteCategory(cine)).toBe('deleted')

    expect(await listCategories()).toEqual([salidas])
  })

  it('archives a category with movements instead of deleting it', async () => {
    const category = await createCategory({ name: 'Supermercado', kind: 'expense' })
    await addMovement(category.id)

    expect(await deleteCategory(category)).toBe('archived')

    expect(await listCategories()).toEqual([{ ...category, archived: true }])
  })

  it('refuses to delete an archived category with movements', async () => {
    const category = await createCategory({ name: 'Supermercado', kind: 'expense' })
    await addMovement(category.id)
    await deleteCategory(category)

    await expect(deleteCategory({ ...category, archived: true })).rejects.toThrow(
      '«Supermercado» tiene movimientos, así que no se puede eliminar.',
    )
  })
})

describe('restoreCategory', () => {
  it('restores an archived category', async () => {
    const category = await createCategory({ name: 'Supermercado', kind: 'expense' })
    await addMovement(category.id)
    await deleteCategory(category)

    const restored = await restoreCategory({ ...category, archived: true })

    expect(restored).toEqual({ ...category, archived: false })
    expect(await listCategories()).toEqual([restored])
  })
})

describe('names taken by archived categories', () => {
  it('suggests restoring the archived one', async () => {
    const category = await createCategory({ name: 'Supermercado', kind: 'expense' })
    await addMovement(category.id)
    await deleteCategory(category)

    await expect(createCategory({ name: 'SUPERMERCADO', kind: 'expense' })).rejects.toThrow(
      'Ya existe una categoría de gasto archivada con ese nombre. Restaurala desde «Archivadas».',
    )
  })
})

describe('createSuggestedCategories', () => {
  it('creates all suggestions and never duplicates them', async () => {
    await createSuggestedCategories(await listCategories())
    await createSuggestedCategories(await listCategories())

    const names = (await listCategories()).map((c) => `${c.kind}:${c.name}`).sort()
    const expected = SUGGESTED_CATEGORIES.map((c) => `${c.kind}:${c.name}`).sort()
    expect(names).toEqual(expected)
  })

  it('only creates the missing ones', async () => {
    await createCategory({ name: 'sueldo', kind: 'income' })

    await createSuggestedCategories(await listCategories())

    const categories = await listCategories()
    expect(categories).toHaveLength(SUGGESTED_CATEGORIES.length)
    expect(categories.filter((c) => c.kind === 'income').map((c) => c.name)).toContain('sueldo')
  })
})

describe('without a session', () => {
  it('reports errors in Spanish instead of failing silently', async () => {
    const category = await createCategory({ name: 'Cine', kind: 'expense' })
    await supabase.auth.signOut()

    await expect(createCategory({ name: 'Teatro', kind: 'expense' })).rejects.toThrow(
      'No se pudo guardar. Revisá tu conexión y probá de nuevo.',
    )
    await expect(renameCategory(category, 'Teatro')).rejects.toThrow(
      'No se pudo guardar. Revisá tu conexión y probá de nuevo.',
    )
    await expect(deleteCategory(category)).rejects.toThrow(
      'No se pudo eliminar la categoría. Probá de nuevo.',
    )
    await expect(createSuggestedCategories([])).rejects.toThrow(
      'No se pudieron crear las categorías sugeridas. Probá de nuevo.',
    )
    await expect(restoreCategory({ ...category, archived: true })).rejects.toThrow(
      'No se pudo restaurar la categoría. Probá de nuevo.',
    )
  })
})
