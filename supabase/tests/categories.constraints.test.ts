import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestUser, deleteTestUsers, PG, type TestUser } from './helpers'

let user: TestUser

beforeAll(async () => {
  user = await createTestUser()
})

afterAll(async () => {
  await deleteTestUsers(user)
})

function insert(name: string, kind: 'income' | 'expense' = 'expense') {
  return user.client.from('categories').insert({ name, kind })
}

describe('categories name rules', () => {
  it.each([
    ['empty', ''],
    ['leading space', ' Comida'],
    ['trailing space', 'Comida '],
    ['repeated inner spaces', 'Café  con leche'],
    ['tab inside', 'Café\tcon leche'],
    ['51 characters', 'a'.repeat(51)],
  ])('rejects %s', async (_case, name) => {
    const { error } = await insert(name)

    expect(error?.code).toBe(PG.checkViolation)
  })

  it('accepts 50 characters, counting emoji as one', async () => {
    const { error } = await insert('🐷'.repeat(50))

    expect(error).toBeNull()
  })

  it('accepts accents and ñ as they are', async () => {
    const { data, error } = await insert('Niñera y educación').select('name').single()

    expect(error).toBeNull()
    expect(data?.name).toBe('Niñera y educación')
  })

  it('rejects an unknown kind', async () => {
    const { error } = await user.client
      .from('categories')
      .insert({ name: 'Raro', kind: 'transfer' })

    expect(error?.code).toBe(PG.invalidEnumValue)
  })
})

describe('categories uniqueness', () => {
  it('rejects the same name and kind ignoring case', async () => {
    expect((await insert('Comida')).error).toBeNull()

    const { error } = await insert('comida')

    expect(error?.code).toBe(PG.uniqueViolation)
  })

  it('allows the same name with the other kind', async () => {
    expect((await insert('Otros', 'expense')).error).toBeNull()

    const { error } = await insert('Otros', 'income')

    expect(error).toBeNull()
  })

  it('treats accents as different names', async () => {
    expect((await insert('Educacion')).error).toBeNull()

    const { error } = await insert('Educación')

    expect(error).toBeNull()
  })

  it('rejects renaming to an existing name', async () => {
    const { data } = await insert('Salidas').select('id').single()
    await insert('Cine')

    const { error } = await user.client
      .from('categories')
      .update({ name: 'CINE' })
      .eq('id', data?.id ?? '')

    expect(error?.code).toBe(PG.uniqueViolation)
  })
})
