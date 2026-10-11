import type { SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { anonClient, createTestUser, deleteTestUsers, PG, type TestUser } from './helpers'

let alice: TestUser
let bob: TestUser
let aliceCategoryId: string
let bobCategoryId: string
let aliceMovementId: string

async function createCategory(client: SupabaseClient, name: string) {
  const { data, error } = await client
    .from('categories')
    .insert({ name, kind: 'expense' })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

const movement = (categoryId: string) => ({
  category_id: categoryId,
  amount: 123456,
  currency: 'ARS',
  occurred_on: '2026-10-07',
  description: 'Compra del mes',
})

beforeAll(async () => {
  alice = await createTestUser()
  bob = await createTestUser()
  aliceCategoryId = await createCategory(alice.client, 'Supermercado')
  bobCategoryId = await createCategory(bob.client, 'Supermercado')

  const { data, error } = await alice.client
    .from('movements')
    .insert(movement(aliceCategoryId))
    .select('id')
    .single()
  if (error) throw error
  aliceMovementId = data.id
})

afterAll(async () => {
  await deleteTestUsers(alice, bob)
})

async function aliceMovementAmount() {
  const { data, error } = await alice.client
    .from('movements')
    .select('amount')
    .eq('id', aliceMovementId)
    .single()
  if (error) throw error
  return data.amount
}

describe('movements RLS between users', () => {
  it('sets user_id from the session and keeps the amount exact', async () => {
    const { data, error } = await alice.client
      .from('movements')
      .select('user_id, amount, currency, occurred_on')
      .eq('id', aliceMovementId)
      .single()

    expect(error).toBeNull()
    expect(data).toEqual({
      user_id: alice.id,
      amount: 123456,
      currency: 'ARS',
      occurred_on: '2026-10-07',
    })
  })

  it('does not let another user read them', async () => {
    const { data, error } = await bob.client.from('movements').select('id')

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('does not let another user update them', async () => {
    const { data, error } = await bob.client
      .from('movements')
      .update({ amount: 1 })
      .eq('id', aliceMovementId)
      .select('id')

    expect(error).toBeNull()
    expect(data).toEqual([])
    expect(await aliceMovementAmount()).toBe(123456)
  })

  it('does not let another user delete them', async () => {
    const { data, error } = await bob.client
      .from('movements')
      .delete()
      .eq('id', aliceMovementId)
      .select('id')

    expect(error).toBeNull()
    expect(data).toEqual([])
    expect(await aliceMovementAmount()).toBe(123456)
  })

  it("does not let a user create a movement in someone else's category", async () => {
    const { error } = await bob.client.from('movements').insert(movement(aliceCategoryId))

    expect(error?.code).toBe(PG.foreignKeyViolation)
  })

  it("does not let a user move a movement to someone else's category", async () => {
    const { error } = await alice.client
      .from('movements')
      .update({ category_id: bobCategoryId })
      .eq('id', aliceMovementId)

    expect(error?.code).toBe(PG.foreignKeyViolation)
  })

  it('does not let a user create movements for someone else', async () => {
    const { error } = await bob.client
      .from('movements')
      .insert({ ...movement(bobCategoryId), user_id: alice.id })

    expect(error?.code).toBe(PG.insufficientPrivilege)
  })

  it('does not allow changing user_id', async () => {
    const { error } = await alice.client
      .from('movements')
      .update({ user_id: bob.id })
      .eq('id', aliceMovementId)

    expect(error?.code).toBe(PG.insufficientPrivilege)
  })
})

describe('movements without a session', () => {
  it('cannot read', async () => {
    const { error } = await anonClient().from('movements').select('id')

    expect(error?.code).toBe(PG.insufficientPrivilege)
  })

  it('cannot insert', async () => {
    const { error } = await anonClient().from('movements').insert(movement(aliceCategoryId))

    expect(error?.code).toBe(PG.insufficientPrivilege)
  })
})
