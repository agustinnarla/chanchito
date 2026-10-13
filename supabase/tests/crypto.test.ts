import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { anonClient, createTestUser, deleteTestUsers, PG, type TestUser } from './helpers'

let alice: TestUser
let bob: TestUser
let alicePurchaseId: string

const purchase = { quantity: 1250000, cost: 145000000, occurred_on: '2026-10-12' }

beforeAll(async () => {
  alice = await createTestUser()
  bob = await createTestUser()
  const { data, error } = await alice.client
    .from('crypto_purchases')
    .insert(purchase)
    .select('id')
    .single()
  if (error) throw error
  alicePurchaseId = data.id
})

afterAll(async () => {
  await deleteTestUsers(alice, bob)
})

const insert = (overrides: Record<string, unknown>) =>
  alice.client.from('crypto_purchases').insert({ ...purchase, ...overrides })

describe('crypto purchases', () => {
  it('sets the user, bitcoin, pesos and Binance from defaults', async () => {
    const { data, error } = await alice.client
      .from('crypto_purchases')
      .select('user_id, asset, cost_currency, platform')
      .eq('id', alicePurchaseId)
      .single()

    expect(error).toBeNull()
    expect(data).toEqual({
      user_id: alice.id,
      asset: 'BTC',
      cost_currency: 'ARS',
      platform: 'Binance',
    })
  })

  it.each([
    ['a quantity of 0', { quantity: 0 }],
    ['a negative quantity', { quantity: -1 }],
    ['a cost of 0', { cost: 0 }],
    ['a cost beyond Number.MAX_SAFE_INTEGER', { cost: Number.MAX_SAFE_INTEGER + 1 }],
    ['an empty platform', { platform: '' }],
    ['a platform with surrounding spaces', { platform: ' Binance ' }],
    ['a platform longer than 30 characters', { platform: 'a'.repeat(31) }],
  ])('rejects %s', async (_, overrides) => {
    expect((await insert(overrides)).error?.code).toBe(PG.checkViolation)
  })

  it('does not let the asset be chosen or changed', async () => {
    expect((await insert({ asset: 'ETH' })).error?.code).toBe(PG.insufficientPrivilege)
    const { error } = await alice.client
      .from('crypto_purchases')
      .update({ asset: 'ETH' })
      .eq('id', alicePurchaseId)
    expect(error?.code).toBe(PG.insufficientPrivilege)
  })

  it('lets the quantity, cost, platform and date change', async () => {
    const { error } = await alice.client
      .from('crypto_purchases')
      .update({ quantity: 1, cost: 1, platform: 'Binance P2P', occurred_on: '2026-10-01' })
      .eq('id', alicePurchaseId)
    expect(error).toBeNull()
  })

  it("does not let another user read, change or delete a user's purchases", async () => {
    expect((await bob.client.from('crypto_purchases').select('id')).data).toEqual([])

    const updated = await bob.client
      .from('crypto_purchases')
      .update({ cost: 1 })
      .eq('id', alicePurchaseId)
      .select('id')
    expect(updated.data).toEqual([])

    const deleted = await bob.client
      .from('crypto_purchases')
      .delete()
      .eq('id', alicePurchaseId)
      .select('id')
    expect(deleted.data).toEqual([])
  })

  it('does not let a user create purchases for someone else', async () => {
    const { error } = await bob.client
      .from('crypto_purchases')
      .insert({ ...purchase, user_id: alice.id })
    expect(error?.code).toBe(PG.insufficientPrivilege)
  })

  it('does not let anyone without a session read them', async () => {
    const { data, error } = await anonClient().from('crypto_purchases').select('id')
    expect(data ?? []).toEqual([])
    if (error) expect(error.code).toBe(PG.insufficientPrivilege)
  })
})
