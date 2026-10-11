import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestUser, deleteTestUsers, PG, type TestUser } from './helpers'

let user: TestUser
let seq = 0

beforeAll(async () => {
  user = await createTestUser()
})

afterAll(async () => {
  await deleteTestUsers(user)
})

function insert(emoji?: string) {
  seq += 1
  return user.client
    .from('categories')
    .insert({
      name: `Categoría ${seq}`,
      kind: 'expense',
      ...(emoji === undefined ? {} : { emoji }),
    })
    .select('id, emoji')
    .single()
}

describe('categories emoji', () => {
  it('defaults to package', async () => {
    const { data, error } = await insert()

    expect(error).toBeNull()
    expect(data?.emoji).toBe('package')
  })

  it('can be set when creating', async () => {
    const { data, error } = await insert('shopping_cart')

    expect(error).toBeNull()
    expect(data?.emoji).toBe('shopping_cart')
  })

  it.each(['', 'Shopping', 'two words', 'a-b', '🐷', 'a'.repeat(41)])(
    'rejects the key %j',
    async (emoji) => {
      const { error } = await insert(emoji)

      expect(error?.code).toBe(PG.checkViolation)
    },
  )

  it('can be changed, but the kind still cannot', async () => {
    const { data: created } = await insert()
    const id = created?.id ?? ''

    const changed = await user.client
      .from('categories')
      .update({ emoji: 'house' })
      .eq('id', id)
      .select('emoji')
      .single()
    expect(changed.error).toBeNull()
    expect(changed.data?.emoji).toBe('house')

    const kind = await user.client.from('categories').update({ kind: 'income' }).eq('id', id)
    expect(kind.error?.code).toBe(PG.insufficientPrivilege)
  })

  it("cannot change another user's category", async () => {
    const other = await createTestUser()
    try {
      const { data: created } = await insert()
      const { data, error } = await other.client
        .from('categories')
        .update({ emoji: 'house' })
        .eq('id', created?.id ?? '')
        .select('id')

      expect(error).toBeNull()
      expect(data).toEqual([])
    } finally {
      await deleteTestUsers(other)
    }
  })
})
