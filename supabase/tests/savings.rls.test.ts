import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { anonClient, createTestUser, deleteTestUsers, PG, type TestUser } from './helpers'

let alice: TestUser
let bob: TestUser
let aliceGoalId: string
let aliceContributionId: string

const goal = {
  name: 'Celular nuevo',
  target_amount: 80000,
  target_currency: 'USD',
  saving_currency: 'ARS',
}

beforeAll(async () => {
  alice = await createTestUser()
  bob = await createTestUser()

  const created = await alice.client.from('savings_goals').insert(goal).select('id').single()
  if (created.error) throw created.error
  aliceGoalId = created.data.id

  const contribution = await alice.client
    .from('savings_contributions')
    .insert({ goal_id: aliceGoalId, amount: 8000000, currency: 'ARS', occurred_on: '2026-10-12' })
    .select('id')
    .single()
  if (contribution.error) throw contribution.error
  aliceContributionId = contribution.data.id
})

afterAll(async () => {
  await deleteTestUsers(alice, bob)
})

describe('savings goals RLS', () => {
  it('sets user_id, the default emoji and not archived from defaults', async () => {
    const { data, error } = await alice.client
      .from('savings_goals')
      .select('user_id, emoji, archived')
      .eq('id', aliceGoalId)
      .single()

    expect(error).toBeNull()
    expect(data).toEqual({ user_id: alice.id, emoji: 'package', archived: false })
  })

  it("does not let another user read, update or delete a user's goals", async () => {
    expect((await bob.client.from('savings_goals').select('id')).data).toEqual([])

    const updated = await bob.client
      .from('savings_goals')
      .update({ name: 'Mío' })
      .eq('id', aliceGoalId)
      .select('id')
    expect(updated.data).toEqual([])

    const deleted = await bob.client
      .from('savings_goals')
      .delete()
      .eq('id', aliceGoalId)
      .select('id')
    expect(deleted.data).toEqual([])
  })

  it('does not let anyone without a session read them', async () => {
    const { data, error } = await anonClient().from('savings_goals').select('id')
    expect(data ?? []).toEqual([])
    if (error) expect(error.code).toBe(PG.insufficientPrivilege)
  })

  it('does not let a user create goals for someone else', async () => {
    const { error } = await bob.client.from('savings_goals').insert({ ...goal, user_id: alice.id })
    expect(error?.code).toBe(PG.insufficientPrivilege)
  })
})

describe('savings contributions RLS', () => {
  it("does not let another user read, update or delete a user's contributions", async () => {
    expect((await bob.client.from('savings_contributions').select('id')).data).toEqual([])

    const updated = await bob.client
      .from('savings_contributions')
      .update({ amount: 1 })
      .eq('id', aliceContributionId)
      .select('id')
    expect(updated.data).toEqual([])

    const deleted = await bob.client
      .from('savings_contributions')
      .delete()
      .eq('id', aliceContributionId)
      .select('id')
    expect(deleted.data).toEqual([])
  })

  it("does not let a user put money into another user's goal", async () => {
    const { error } = await bob.client
      .from('savings_contributions')
      .insert({ goal_id: aliceGoalId, amount: 100, currency: 'ARS', occurred_on: '2026-10-12' })
    expect(error?.code).toBe(PG.foreignKeyViolation)
  })

  it('does not let anyone without a session read them', async () => {
    const { data, error } = await anonClient().from('savings_contributions').select('id')
    expect(data ?? []).toEqual([])
    if (error) expect(error.code).toBe(PG.insufficientPrivilege)
  })
})
