import type { SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { anonClient, createTestUser, deleteTestUsers, PG, type TestUser } from './helpers'

let alice: TestUser
let bob: TestUser

beforeAll(async () => {
  alice = await createTestUser()
  bob = await createTestUser()
})

afterAll(async () => {
  await deleteTestUsers(alice, bob)
})

async function category(
  client: SupabaseClient,
  name: string,
  kind: 'expense' | 'income' = 'expense',
) {
  const { data, error } = await client
    .from('categories')
    .insert({ name, kind })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

const insert = (client: SupabaseClient, overrides: Record<string, unknown>) =>
  client.from('weekly_budgets').insert({ amount: 4000000, currency: 'ARS', ...overrides })

describe('weekly budgets', () => {
  it('sets the user and the expense kind from defaults', async () => {
    const categoryId = await category(alice.client, 'Supermercado')
    const { data, error } = await insert(alice.client, { category_id: categoryId })
      .select('user_id, category_kind, amount, currency')
      .single()

    expect(error).toBeNull()
    expect(data).toEqual({
      user_id: alice.id,
      category_kind: 'expense',
      amount: 4000000,
      currency: 'ARS',
    })
  })

  it('allows one per category and currency, alongside a monthly budget', async () => {
    const categoryId = await category(alice.client, 'Verdulería')
    expect((await insert(alice.client, { category_id: categoryId })).error).toBeNull()
    expect((await insert(alice.client, { category_id: categoryId })).error?.code).toBe(
      PG.uniqueViolation,
    )
    expect(
      (await insert(alice.client, { category_id: categoryId, currency: 'USD' })).error,
    ).toBeNull()
    const monthly = await alice.client
      .from('budgets')
      .insert({ category_id: categoryId, month: '2026-10-01', amount: 1, currency: 'ARS' })
    expect(monthly.error).toBeNull()
  })

  it.each([0, -1, Number.MAX_SAFE_INTEGER + 1])('rejects an amount of %i', async (amount) => {
    const categoryId = await category(alice.client, `Monto ${amount}`)
    expect((await insert(alice.client, { category_id: categoryId, amount })).error?.code).toBe(
      PG.checkViolation,
    )
  })

  it('rejects an income category', async () => {
    const categoryId = await category(alice.client, 'Sueldo', 'income')
    expect((await insert(alice.client, { category_id: categoryId })).error?.code).toBe(
      PG.foreignKeyViolation,
    )
  })

  it('only lets the amount change', async () => {
    const categoryId = await category(alice.client, 'Salidas')
    const other = await category(alice.client, 'Transporte')
    const { data } = await insert(alice.client, { category_id: categoryId }).select('id').single()

    const amount = await alice.client
      .from('weekly_budgets')
      .update({ amount: 5 })
      .eq('id', data?.id)
    expect(amount.error).toBeNull()
    const moved = await alice.client
      .from('weekly_budgets')
      .update({ category_id: other })
      .eq('id', data?.id)
    expect(moved.error?.code).toBe(PG.insufficientPrivilege)
  })

  it('goes with its category when the category is deleted', async () => {
    const categoryId = await category(alice.client, 'Para borrar')
    await insert(alice.client, { category_id: categoryId })
    await alice.client.from('categories').delete().eq('id', categoryId)

    const { data } = await alice.client
      .from('weekly_budgets')
      .select('id')
      .eq('category_id', categoryId)
    expect(data).toEqual([])
  })

  it("does not let another user see, change or use someone else's", async () => {
    const aliceCategory = await category(alice.client, 'Farmacia')
    const { data } = await insert(alice.client, { category_id: aliceCategory })
      .select('id')
      .single()

    expect((await bob.client.from('weekly_budgets').select('id')).data).toEqual([])
    const updated = await bob.client
      .from('weekly_budgets')
      .update({ amount: 1 })
      .eq('id', data?.id)
      .select('id')
    expect(updated.data).toEqual([])
    expect((await insert(bob.client, { category_id: aliceCategory })).error?.code).toBe(
      PG.foreignKeyViolation,
    )
  })

  it('does not let anyone without a session read them', async () => {
    const { data, error } = await anonClient().from('weekly_budgets').select('id')
    expect(data ?? []).toEqual([])
    if (error) expect(error.code).toBe(PG.insufficientPrivilege)
  })
})
