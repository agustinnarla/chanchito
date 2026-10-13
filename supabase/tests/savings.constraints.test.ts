import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestUser, deleteTestUsers, PG, type TestUser } from './helpers'

let user: TestUser
let nextName = 0

beforeAll(async () => {
  user = await createTestUser()
})

afterAll(async () => {
  await deleteTestUsers(user)
})

/** A different name each time, so goals don't clash with each other. */
function uniqueName() {
  nextName += 1
  return `Meta ${nextName}`
}

function insertGoal(overrides: Record<string, unknown> = {}) {
  return user.client.from('savings_goals').insert({
    name: uniqueName(),
    target_amount: 80000,
    target_currency: 'USD',
    saving_currency: 'ARS',
    ...overrides,
  })
}

async function createGoal(overrides: Record<string, unknown> = {}) {
  const { data, error } = await insertGoal(overrides).select('id').single()
  if (error) throw error
  return data.id as string
}

function contribute(goalId: string, overrides: Record<string, unknown> = {}) {
  return user.client.from('savings_contributions').insert({
    goal_id: goalId,
    amount: 1000,
    currency: 'ARS',
    occurred_on: '2026-10-12',
    ...overrides,
  })
}

describe('savings goals', () => {
  it.each([
    ['an empty name', { name: '' }],
    ['a name with surrounding spaces', { name: ' Celular ' }],
    ['a name longer than 40 characters', { name: 'a'.repeat(41) }],
    ['a malformed emoji key', { emoji: 'Not An Emoji' }],
    ['a target of 0', { target_amount: 0 }],
    ['a negative target', { target_amount: -1 }],
    ['a target beyond Number.MAX_SAFE_INTEGER', { target_amount: Number.MAX_SAFE_INTEGER + 1 }],
  ])('rejects %s', async (_, overrides) => {
    expect((await insertGoal(overrides)).error?.code).toBe(PG.checkViolation)
  })

  it('rejects a currency outside ARS and USD', async () => {
    expect((await insertGoal({ saving_currency: 'EUR' })).error?.code).toBe(PG.invalidEnumValue)
  })

  it('rejects a name already used, ignoring case', async () => {
    await createGoal({ name: 'Vacaciones' })
    expect((await insertGoal({ name: 'VACACIONES' })).error?.code).toBe(PG.uniqueViolation)
  })

  it('lets the name, emoji, target and archived change, but not the saving currency', async () => {
    const id = await createGoal()
    const allowed = await user.client
      .from('savings_goals')
      .update({
        name: uniqueName(),
        emoji: 'mobile_phone',
        target_amount: 90000,
        target_currency: 'ARS',
        archived: true,
      })
      .eq('id', id)
    expect(allowed.error).toBeNull()

    const currency = await user.client
      .from('savings_goals')
      .update({ saving_currency: 'USD' })
      .eq('id', id)
    expect(currency.error?.code).toBe(PG.insufficientPrivilege)
  })
})

describe('savings contributions', () => {
  it('accepts deposits and withdrawals', async () => {
    const id = await createGoal()
    expect((await contribute(id, { amount: 5000 })).error).toBeNull()
    expect((await contribute(id, { amount: -2000 })).error).toBeNull()
  })

  it.each([0, Number.MAX_SAFE_INTEGER + 1, -Number.MAX_SAFE_INTEGER - 1])(
    'rejects an amount of %i',
    async (amount) => {
      const id = await createGoal()
      expect((await contribute(id, { amount })).error?.code).toBe(PG.checkViolation)
    },
  )

  it("rejects a contribution in another currency than the goal's savings", async () => {
    const id = await createGoal({ saving_currency: 'ARS' })
    expect((await contribute(id, { currency: 'USD' })).error?.code).toBe(PG.foreignKeyViolation)
  })

  it('lets the amount and date change, but not the goal', async () => {
    const id = await createGoal()
    const other = await createGoal()
    const { data, error } = await contribute(id).select('id').single()
    if (error) throw error

    const allowed = await user.client
      .from('savings_contributions')
      .update({ amount: 3000, occurred_on: '2026-09-30' })
      .eq('id', data.id)
    expect(allowed.error).toBeNull()

    const moved = await user.client
      .from('savings_contributions')
      .update({ goal_id: other })
      .eq('id', data.id)
    expect(moved.error?.code).toBe(PG.insufficientPrivilege)
  })

  it('deletes the contributions when their goal is deleted', async () => {
    const id = await createGoal()
    await contribute(id)
    await user.client.from('savings_goals').delete().eq('id', id)

    const { data } = await user.client.from('savings_contributions').select('id').eq('goal_id', id)
    expect(data).toEqual([])
  })
})
