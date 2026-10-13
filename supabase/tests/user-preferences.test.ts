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

const save = (user: TestUser, accent: string, userId = user.id) =>
  user.client
    .from('user_preferences')
    .upsert({ user_id: userId, accent, updated_at: new Date().toISOString() })
    .select('user_id, accent')

describe('user preferences', () => {
  it('starts without a row, so the app uses the defaults', async () => {
    const { data, error } = await alice.client.from('user_preferences').select('accent')
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('creates the row with an upsert and then updates it', async () => {
    expect((await save(alice, 'azul')).data).toEqual([{ user_id: alice.id, accent: 'azul' }])
    expect((await save(alice, 'violeta')).data).toEqual([{ user_id: alice.id, accent: 'violeta' }])
  })

  it('rejects an accent outside the six palettes', async () => {
    expect((await save(alice, 'amarillo')).error?.code).toBe(PG.checkViolation)
  })

  it("does not let another user read or change a user's preferences", async () => {
    expect((await bob.client.from('user_preferences').select('accent')).data).toEqual([])

    const { error } = await save(bob, 'rosa', alice.id)
    expect(error?.code).toBe(PG.insufficientPrivilege)

    const { data } = await alice.client.from('user_preferences').select('accent').single()
    expect(data?.accent).toBe('violeta')
  })

  it('does not let anyone without a session read them', async () => {
    const { data, error } = await anonClient().from('user_preferences').select('accent')
    expect(data ?? []).toEqual([])
    if (error) expect(error.code).toBe(PG.insufficientPrivilege)
  })
})
