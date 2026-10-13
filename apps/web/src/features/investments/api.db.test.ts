import type { CryptoPurchaseInput } from '@chanchito/core'
import type { TestCredentials } from '@chanchito/supabase/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanUpUsers, otherUserClient, signInAsNewUser } from '@/test/db'
import { createPurchase, deletePurchase, listPurchases, updatePurchase } from './api'

let user: TestCredentials | undefined

beforeEach(async () => {
  user = await signInAsNewUser()
})

afterEach(async () => {
  await cleanUpUsers(user)
  user = undefined
})

const input = (overrides: Partial<CryptoPurchaseInput> = {}): CryptoPurchaseInput => ({
  quantity: 350000,
  cost: { amount: 49000000, currency: 'ARS' },
  platform: 'Binance',
  occurredOn: '2026-10-12',
  ...overrides,
})

describe('purchases', () => {
  it('stores purchases and lists them newest first', async () => {
    const older = await createPurchase(input({ occurredOn: '2025-03-10' }))
    const newer = await createPurchase(input())

    expect(newer).toEqual({ id: expect.any(String), ...input() })
    expect(await listPurchases()).toEqual([newer, older])
  })

  it('keeps large quantities and costs exact', async () => {
    const big = input({
      quantity: Number.MAX_SAFE_INTEGER,
      cost: { amount: Number.MAX_SAFE_INTEGER, currency: 'ARS' },
    })
    expect(await createPurchase(big)).toMatchObject({
      quantity: Number.MAX_SAFE_INTEGER,
      cost: big.cost,
    })
  })

  it('rejects an invalid purchase with its message', async () => {
    await expect(createPurchase(input({ quantity: 0 }))).rejects.toMatchObject({
      message: 'Algún dato de la compra no es válido. Revisalo y probá de nuevo.',
    })
  })

  it('updates and deletes a purchase', async () => {
    const purchase = await createPurchase(input())

    const updated = await updatePurchase(
      purchase.id,
      input({ quantity: 400000, platform: 'Binance P2P' }),
    )
    expect(updated).toMatchObject({ quantity: 400000, platform: 'Binance P2P' })

    await deletePurchase(purchase.id)
    expect(await listPurchases()).toEqual([])
  })

  it("doesn't show a purchase to another user", async () => {
    await createPurchase(input())
    const other = await otherUserClient()
    try {
      const { data } = await other.client.from('crypto_purchases').select('id')
      expect(data).toEqual([])
    } finally {
      await cleanUpUsers(other.credentials)
    }
  })
})
