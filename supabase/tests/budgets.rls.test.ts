import type { SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { anonClient, createTestUser, deleteTestUsers, PG, type TestUser } from './helpers'

let alice: TestUser
let bob: TestUser
let aliceCategoryId: string
let bobCategoryId: string
let aliceBudgetId: string

async function createCategory(client: SupabaseClient, name: string) {
  const { data, error } = await client
    .from('categories')
    .insert({ name, kind: 'expense' })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

const budget = (categoryId: string) => ({
  category_id: categoryId,
  month: '2026-10-01',
  amount: 6000000,
  currency: 'ARS',
})

beforeAll(async () => {
  alice = await createTestUser()
  bob = await createTestUser()
  aliceCategoryId = await createCategory(alice.client, 'Supermercado')
  bobCategoryId = await createCategory(bob.client, 'Supermercado')

  const { data, error } = await alice.client
    .from('budgets')
    .insert(budget(aliceCategoryId))
    .select('id')
    .single()
  if (error) throw error
  aliceBudgetId = data.id
})

afterAll(async () => {
  await deleteTestUsers(alice, bob)
})

async function aliceBudgetAmount() {
  const { data, error } = await alice.client
    .from('budgets')
    .select('amount')
    .eq('id', aliceBudgetId)
    .single()
  if (error) throw error
  return data.amount
}

describe('budgets RLS between users', () => {
  it('sets user_id and the expense kind from defaults', async () => {
    const { data, error } = await alice.client
      .from('budgets')
      .select('user_id, category_kind, month, amount, currency')
      .eq('id', aliceBudgetId)
      .single()

    expect(error).toBeNull()
    expect(data).toEqual({
      user_id: alice.id,
      category_kind: 'expense',
      month: '2026-10-01',
      amount: 6000000,
      currency: 'ARS',
    })
  })

  it('does not let another user read them', async () => {
    const { data, error } = await bob.client.from('budgets').select('id')

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('does not let another user update them', async () => {
    const { data, error } = await bob.client
      .from('budgets')
      .update({ amount: 1 })
      .eq('id', aliceBudgetId)
      .select('id')

    expect(error).toBeNull()
    expect(data).toEqual([])
    expect(await aliceBudgetAmount()).toBe(6000000)
  })

  it('does not let another user delete them', async () => {
    const { data, error } = await bob.client
      .from('budgets')
      .delete()
      .eq('id', aliceBudgetId)
      .select('id')

    expect(error).toBeNull()
    expect(data).toEqual([])
    expect(await aliceBudgetAmount()).toBe(6000000)
  })

  it("does not let a user create a budget for someone else's category", async () => {
    const { error } = await bob.client.from('budgets').insert(budget(aliceCategoryId))

    expect(error?.code).toBe(PG.foreignKeyViolation)
  })

  it('does not let a user create budgets for someone else', async () => {
    const { error } = await bob.client
      .from('budgets')
      .insert({ ...budget(bobCategoryId), user_id: alice.id })

    expect(error?.code).toBe(PG.insufficientPrivilege)
  })
})

describe('budgets without a session', () => {
  it('cannot read', async () => {
    const { error } = await anonClient().from('budgets').select('id')

    expect(error?.code).toBe(PG.insufficientPrivilege)
  })

  it('cannot insert', async () => {
    const { error } = await anonClient().from('budgets').insert(budget(aliceCategoryId))

    expect(error?.code).toBe(PG.insufficientPrivilege)
  })
})
