import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { anonClient, createTestUser, deleteTestUsers, PG, type TestUser } from './helpers'

let alice: TestUser
let bob: TestUser
let aliceCategoryId: string

beforeAll(async () => {
  alice = await createTestUser()
  bob = await createTestUser()

  const { data, error } = await alice.client
    .from('categories')
    .insert({ name: 'Supermercado', kind: 'expense' })
    .select('id')
    .single()
  if (error) throw error
  aliceCategoryId = data.id
})

afterAll(async () => {
  await deleteTestUsers(alice, bob)
})

async function aliceCategoryName() {
  const { data, error } = await alice.client
    .from('categories')
    .select('name')
    .eq('id', aliceCategoryId)
    .single()
  if (error) throw error
  return data.name
}

describe('categories RLS between users', () => {
  it('sets user_id from the session on insert', async () => {
    const { data, error } = await alice.client
      .from('categories')
      .select('user_id')
      .eq('id', aliceCategoryId)
      .single()

    expect(error).toBeNull()
    expect(data?.user_id).toBe(alice.id)
  })

  it('lets a user read their own categories', async () => {
    const { data, error } = await alice.client.from('categories').select('id')

    expect(error).toBeNull()
    expect(data?.map((c) => c.id)).toContain(aliceCategoryId)
  })

  it('does not let another user read them', async () => {
    const { data, error } = await bob.client.from('categories').select('id')

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('does not let another user rename them', async () => {
    const { data, error } = await bob.client
      .from('categories')
      .update({ name: 'Hackeado' })
      .eq('id', aliceCategoryId)
      .select('id')

    expect(error).toBeNull()
    expect(data).toEqual([])
    expect(await aliceCategoryName()).toBe('Supermercado')
  })

  it('does not let another user delete them', async () => {
    const { data, error } = await bob.client
      .from('categories')
      .delete()
      .eq('id', aliceCategoryId)
      .select('id')

    expect(error).toBeNull()
    expect(data).toEqual([])
    expect(await aliceCategoryName()).toBe('Supermercado')
  })

  it('does not let a user create categories for someone else', async () => {
    const { error } = await bob.client
      .from('categories')
      .insert({ name: 'Intruso', kind: 'expense', user_id: alice.id })

    expect(error?.code).toBe(PG.insufficientPrivilege)
  })

  it('lets two users have categories with the same name', async () => {
    const { error } = await bob.client
      .from('categories')
      .insert({ name: 'Supermercado', kind: 'expense' })

    expect(error).toBeNull()
  })
})

describe('categories without a session', () => {
  it('cannot sign up (public signups are disabled)', async () => {
    const { error } = await anonClient().auth.signUp({
      email: 'intruso@example.com',
      password: 'una-contraseña-larga',
    })

    expect(error?.code).toBe('signup_disabled')
  })

  it('cannot read', async () => {
    const { error } = await anonClient().from('categories').select('id')

    expect(error?.code).toBe(PG.insufficientPrivilege)
  })

  it('cannot insert', async () => {
    const { error } = await anonClient()
      .from('categories')
      .insert({ name: 'Anónima', kind: 'expense' })

    expect(error?.code).toBe(PG.insufficientPrivilege)
  })
})

describe('categories immutable columns', () => {
  it('does not allow changing kind', async () => {
    const { error } = await alice.client
      .from('categories')
      .update({ kind: 'income' })
      .eq('id', aliceCategoryId)

    expect(error?.code).toBe(PG.insufficientPrivilege)
  })

  it('does not allow changing user_id', async () => {
    const { error } = await alice.client
      .from('categories')
      .update({ user_id: bob.id })
      .eq('id', aliceCategoryId)

    expect(error?.code).toBe(PG.insufficientPrivilege)
  })

  it('allows renaming', async () => {
    const { error } = await alice.client
      .from('categories')
      .update({ name: 'Súper' })
      .eq('id', aliceCategoryId)

    expect(error).toBeNull()
    expect(await aliceCategoryName()).toBe('Súper')
  })
})
