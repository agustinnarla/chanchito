import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestUser, deleteTestUsers, PG, type TestUser } from './helpers'

let user: TestUser
let categoryId: string
let nextMonth = 0

beforeAll(async () => {
  user = await createTestUser()
  categoryId = await createCategory('Supermercado')
})

afterAll(async () => {
  await deleteTestUsers(user)
})

async function createCategory(name: string, kind: 'expense' | 'income' = 'expense') {
  const { data, error } = await user.client
    .from('categories')
    .insert({ name, kind })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

/** A different month each time, so budgets don't clash with each other. */
function uniqueMonth() {
  nextMonth += 1
  const year = 2030 + Math.floor(nextMonth / 12)
  return `${year}-${String((nextMonth % 12) + 1).padStart(2, '0')}-01`
}

function insert(overrides: Record<string, unknown>) {
  return user.client.from('budgets').insert({
    category_id: categoryId,
    month: uniqueMonth(),
    amount: 1000,
    currency: 'ARS',
    ...overrides,
  })
}

describe('budgets amount', () => {
  it.each([0, -1])('rejects %i', async (amount) => {
    expect((await insert({ amount })).error?.code).toBe(PG.checkViolation)
  })

  it('accepts Number.MAX_SAFE_INTEGER and keeps it exact', async () => {
    const { data, error } = await insert({ amount: Number.MAX_SAFE_INTEGER })
      .select('amount')
      .single()

    expect(error).toBeNull()
    expect(data?.amount).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('rejects amounts beyond Number.MAX_SAFE_INTEGER', async () => {
    expect((await insert({ amount: Number.MAX_SAFE_INTEGER + 1 })).error?.code).toBe(
      PG.checkViolation,
    )
  })

  it('rejects other currencies', async () => {
    expect((await insert({ currency: 'EUR' })).error?.code).toBe(PG.invalidEnumValue)
  })
})

describe('budgets month', () => {
  it.each(['2026-10-02', '2026-10-31'])('rejects %s', async (month) => {
    expect((await insert({ month })).error?.code).toBe(PG.checkViolation)
  })
})

describe('budgets category', () => {
  it('rejects an income category', async () => {
    const incomeId = await createCategory('Sueldo', 'income')

    expect((await insert({ category_id: incomeId })).error?.code).toBe(PG.foreignKeyViolation)
  })

  it('does not allow setting the kind', async () => {
    const incomeId = await createCategory('Freelance', 'income')

    const { error } = await insert({ category_id: incomeId, category_kind: 'income' })
    expect(error?.code).toBe(PG.insufficientPrivilege)
  })
})

describe('one budget per category, month and currency', () => {
  it('rejects a duplicate, but accepts the other currency and another month', async () => {
    const month = uniqueMonth()

    expect((await insert({ month })).error).toBeNull()
    expect((await insert({ month })).error?.code).toBe(PG.uniqueViolation)
    expect((await insert({ month, currency: 'USD' })).error).toBeNull()
    expect((await insert({})).error).toBeNull()
  })
})

describe('budgets updates', () => {
  async function createBudget() {
    const { data, error } = await insert({}).select('id').single()
    if (error) throw error
    return data.id
  }

  it('allows changing the amount', async () => {
    const id = await createBudget()

    const { data, error } = await user.client
      .from('budgets')
      .update({ amount: 2500 })
      .eq('id', id)
      .select('amount')
      .single()
    expect(error).toBeNull()
    expect(data?.amount).toBe(2500)
  })

  it.each([
    ['category_id', '00000000-0000-4000-8000-000000000000'],
    ['month', '2040-01-01'],
    ['currency', 'USD'],
    ['category_kind', 'income'],
  ])('does not allow changing %s', async (column, value) => {
    const id = await createBudget()

    const { error } = await user.client
      .from('budgets')
      .update({ [column]: value })
      .eq('id', id)
    expect(error?.code).toBe(PG.insufficientPrivilege)
  })
})

describe('deleting a category', () => {
  it('deletes its budgets', async () => {
    const otherId = await createCategory('Transporte')
    const { data: created } = await insert({ category_id: otherId }).select('id').single()

    const { error } = await user.client.from('categories').delete().eq('id', otherId)
    expect(error).toBeNull()

    const { data } = await user.client
      .from('budgets')
      .select('id')
      .eq('id', created?.id ?? '')
    expect(data).toEqual([])
  })
})

describe('deleting a user', () => {
  it('deletes their categories and budgets too', async () => {
    const temp = await createTestUser()
    const { data: category } = await temp.client
      .from('categories')
      .insert({ name: 'Supermercado', kind: 'expense' })
      .select('id')
      .single()
    const { error } = await temp.client.from('budgets').insert({
      category_id: category?.id,
      month: '2026-10-01',
      amount: 1000,
      currency: 'ARS',
    })
    expect(error).toBeNull()

    await expect(deleteTestUsers(temp)).resolves.toBeUndefined()
  })
})
