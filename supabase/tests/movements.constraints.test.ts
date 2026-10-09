import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestUser, deleteTestUsers, PG, type TestUser } from './helpers'

let user: TestUser
let categoryId: string

beforeAll(async () => {
  user = await createTestUser()
  const { data, error } = await user.client
    .from('categories')
    .insert({ name: 'Supermercado', kind: 'expense' })
    .select('id')
    .single()
  if (error) throw error
  categoryId = data.id
})

afterAll(async () => {
  await deleteTestUsers(user)
})

function insert(overrides: Record<string, unknown>) {
  return user.client.from('movements').insert({
    category_id: categoryId,
    amount: 1000,
    currency: 'ARS',
    occurred_on: '2026-10-07',
    description: null,
    ...overrides,
  })
}

describe('movements amount', () => {
  it.each([0, -1])('rejects %i', async (amount) => {
    expect((await insert({ amount })).error?.code).toBe(PG.checkViolation)
  })

  it('accepts Number.MAX_SAFE_INTEGER and keeps it exact', async () => {
    const { data, error } = await insert({ amount: Number.MAX_SAFE_INTEGER })
      .select('amount')
      .single()

    expect(error).toBeNull()
    expect(data?.amount).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('rejects amounts beyond Number.MAX_SAFE_INTEGER', async () => {
    expect((await insert({ amount: Number.MAX_SAFE_INTEGER + 1 })).error?.code).toBe(
      PG.checkViolation,
    )
  })

  it('rejects decimals', async () => {
    expect((await insert({ amount: 10.5 })).error).not.toBeNull()
  })
})

describe('movements currency and date', () => {
  it('accepts ARS and USD', async () => {
    expect((await insert({ currency: 'USD' })).error).toBeNull()
  })

  it('rejects other currencies', async () => {
    expect((await insert({ currency: 'EUR' })).error?.code).toBe(PG.invalidEnumValue)
  })

  it('rejects an impossible date', async () => {
    expect((await insert({ occurred_on: '2026-02-30' })).error).not.toBeNull()
  })

  it('accepts February 29 in a leap year', async () => {
    expect((await insert({ occurred_on: '2028-02-29' })).error).toBeNull()
  })
})

describe('movements description', () => {
  it.each([
    ['empty', ''],
    ['leading space', ' Coto'],
    ['repeated inner spaces', 'Cena  con amigos'],
    ['101 characters', 'a'.repeat(101)],
  ])('rejects %s', async (_case, description) => {
    expect((await insert({ description })).error?.code).toBe(PG.checkViolation)
  })

  it.each([
    ['null', null],
    ['100 characters', 'a'.repeat(100)],
    ['accents', 'Niñera y café'],
  ])('accepts %s', async (_case, description) => {
    expect((await insert({ description })).error).toBeNull()
  })
})

describe('categories with movements', () => {
  it('cannot be deleted, but can be deleted once it has no movements', async () => {
    const { data: category } = await user.client
      .from('categories')
      .insert({ name: 'Salidas', kind: 'expense' })
      .select('id')
      .single()
    await insert({ category_id: category?.id })

    const blocked = await user.client
      .from('categories')
      .delete()
      .eq('id', category?.id ?? '')
    expect(blocked.error?.code).toBe(PG.foreignKeyViolation)

    await user.client
      .from('movements')
      .delete()
      .eq('category_id', category?.id ?? '')
    const allowed = await user.client
      .from('categories')
      .delete()
      .eq('id', category?.id ?? '')
    expect(allowed.error).toBeNull()
  })

  it('can be archived and restored', async () => {
    const archive = await user.client
      .from('categories')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', categoryId)
      .select('archived_at')
      .single()
    expect(archive.error).toBeNull()
    expect(archive.data?.archived_at).not.toBeNull()

    const restore = await user.client
      .from('categories')
      .update({ archived_at: null })
      .eq('id', categoryId)
    expect(restore.error).toBeNull()
  })
})

describe('deleting a user', () => {
  it('deletes their categories and movements too', async () => {
    const temp = await createTestUser()
    const { data: category } = await temp.client
      .from('categories')
      .insert({ name: 'Supermercado', kind: 'expense' })
      .select('id')
      .single()
    const { error } = await temp.client.from('movements').insert({
      category_id: category?.id,
      amount: 1000,
      currency: 'ARS',
      occurred_on: '2026-10-07',
    })
    expect(error).toBeNull()

    await expect(deleteTestUsers(temp)).resolves.toBeUndefined()
  })
})
