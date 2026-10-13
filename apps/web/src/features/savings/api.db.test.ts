import type { SavingsGoalInput } from '@chanchito/core'
import type { TestCredentials } from '@chanchito/supabase/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { supabase } from '@/lib/supabase'
import { cleanUpUsers, otherUserClient, signInAsNewUser } from '@/test/db'
import {
  createContribution,
  createGoal,
  deleteContribution,
  deleteGoal,
  listContributions,
  listGoals,
  setGoalArchived,
  updateContribution,
  updateGoal,
} from './api'

let user: TestCredentials | undefined

beforeEach(async () => {
  user = await signInAsNewUser()
})

afterEach(async () => {
  await cleanUpUsers(user)
  user = undefined
})

const phone: SavingsGoalInput = {
  name: 'Celular nuevo',
  emoji: 'mobile_phone',
  target: { amount: 80000, currency: 'USD' },
  savingCurrency: 'ARS',
}

describe('goals', () => {
  it('creates a goal and lists it', async () => {
    const goal = await createGoal(phone)

    expect(goal).toEqual({ id: expect.any(String), ...phone, archived: false })
    expect(await listGoals()).toEqual([goal])
  })

  it('rejects a name already used, ignoring case', async () => {
    await createGoal(phone)

    await expect(createGoal({ ...phone, name: 'CELULAR NUEVO' })).rejects.toMatchObject({
      message: 'Ya tenés una meta con ese nombre.',
      reason: 'duplicate',
    })
  })

  it('updates the name, emoji and target, and archives it', async () => {
    const goal = await createGoal(phone)

    const updated = await updateGoal(goal.id, {
      name: 'Celular',
      emoji: 'laptop',
      target: { amount: 120000000, currency: 'ARS' },
    })
    expect(updated).toMatchObject({
      name: 'Celular',
      emoji: 'laptop',
      target: { amount: 120000000, currency: 'ARS' },
    })
    expect((await setGoalArchived(goal.id, true)).archived).toBe(true)
  })

  it('deletes a goal with its contributions', async () => {
    const goal = await createGoal(phone)
    await createContribution({
      goalId: goal.id,
      amount: { amount: 100, currency: 'ARS' },
      occurredOn: '2026-10-12',
    })

    await deleteGoal(goal.id)

    expect(await listGoals()).toEqual([])
    expect(await listContributions()).toEqual([])
  })

  it("doesn't show a goal to another user", async () => {
    await createGoal(phone)
    const other = await otherUserClient()
    try {
      const { data } = await other.client.from('savings_goals').select('id')
      expect(data).toEqual([])
    } finally {
      await cleanUpUsers(other.credentials)
    }
  })
})

describe('contributions', () => {
  it('stores deposits and withdrawals, newest first', async () => {
    const goal = await createGoal(phone)
    const deposit = await createContribution({
      goalId: goal.id,
      amount: { amount: 8000000, currency: 'ARS' },
      occurredOn: '2026-10-01',
    })
    const withdrawal = await createContribution({
      goalId: goal.id,
      amount: { amount: -1000000, currency: 'ARS' },
      occurredOn: '2026-10-12',
    })

    expect(await listContributions()).toEqual([withdrawal, deposit])
    expect(deposit).toEqual({
      id: expect.any(String),
      goalId: goal.id,
      amount: { amount: 8000000, currency: 'ARS' },
      occurredOn: '2026-10-01',
    })
  })

  it("rejects a contribution in another currency than the goal's savings", async () => {
    const goal = await createGoal(phone)

    await expect(
      createContribution({
        goalId: goal.id,
        amount: { amount: 100, currency: 'USD' },
        occurredOn: '2026-10-12',
      }),
    ).rejects.toMatchObject({ message: 'La meta ya no existe. Recargá la página.', reason: 'goal' })
  })

  it('rejects an amount of zero', async () => {
    const goal = await createGoal(phone)

    await expect(
      createContribution({
        goalId: goal.id,
        amount: { amount: 0, currency: 'ARS' },
        occurredOn: '2026-10-12',
      }),
    ).rejects.toMatchObject({ message: 'El monto no es válido. Revisalo y probá de nuevo.' })
  })

  it('updates the amount and date, and deletes it', async () => {
    const goal = await createGoal(phone)
    const contribution = await createContribution({
      goalId: goal.id,
      amount: { amount: 100, currency: 'ARS' },
      occurredOn: '2026-10-12',
    })

    const updated = await updateContribution(contribution.id, {
      amount: { amount: 250, currency: 'ARS' },
      occurredOn: '2026-09-30',
    })
    expect(updated).toMatchObject({
      amount: { amount: 250, currency: 'ARS' },
      occurredOn: '2026-09-30',
    })

    await deleteContribution(contribution.id)
    expect(await listContributions()).toEqual([])
  })
})

describe('without a session', () => {
  it('reports errors in Spanish', async () => {
    const goal = await createGoal(phone)
    const contribution = await createContribution({
      goalId: goal.id,
      amount: { amount: 100, currency: 'ARS' },
      occurredOn: '2026-10-12',
    })
    await supabase.auth.signOut()

    await expect(listGoals()).rejects.toThrow('No se pudieron cargar las metas.')
    await expect(createGoal(phone)).rejects.toThrow(
      'No se pudo guardar la meta. Revisá tu conexión y probá de nuevo.',
    )
    await expect(updateGoal(goal.id, phone)).rejects.toThrow('No se pudo guardar la meta.')
    await expect(setGoalArchived(goal.id, true)).rejects.toThrow(
      'No se pudo archivar la meta. Probá de nuevo.',
    )
    await expect(deleteGoal(goal.id)).rejects.toThrow(
      'No se pudo eliminar la meta. Probá de nuevo.',
    )
    await expect(listContributions()).rejects.toThrow('No se pudieron cargar los aportes.')
    await expect(
      createContribution({
        goalId: goal.id,
        amount: { amount: 1, currency: 'ARS' },
        occurredOn: '2026-10-12',
      }),
    ).rejects.toThrow('No se pudo guardar el aporte. Revisá tu conexión y probá de nuevo.')
    await expect(
      updateContribution(contribution.id, {
        amount: { amount: 1, currency: 'ARS' },
        occurredOn: '2026-10-12',
      }),
    ).rejects.toThrow('No se pudo guardar el aporte.')
    await expect(deleteContribution(contribution.id)).rejects.toThrow(
      'No se pudo eliminar el aporte. Probá de nuevo.',
    )
  })
})
