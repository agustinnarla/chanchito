import { describe, expect, it } from 'vitest'
import { CategoryInputSchema, CategoryKindSchema, CategorySchema } from './schema'

describe('CategoryKindSchema', () => {
  it('accepts income and expense only', () => {
    expect(CategoryKindSchema.parse('income')).toBe('income')
    expect(CategoryKindSchema.parse('expense')).toBe('expense')
    expect(CategoryKindSchema.safeParse('gasto').success).toBe(false)
  })
})

describe('CategoryInputSchema', () => {
  const parse = (name: string) => CategoryInputSchema.safeParse({ name, kind: 'expense' })

  it('normalizes the name: trims and collapses inner spaces', () => {
    expect(CategoryInputSchema.parse({ name: '  Café   con leche ', kind: 'expense' })).toEqual({
      name: 'Café con leche',
      kind: 'expense',
    })
  })

  it('collapses tabs and newlines too', () => {
    expect(parse('Café\t\ncon leche').data?.name).toBe('Café con leche')
  })

  it('rejects an empty name with a message in Spanish', () => {
    const result = parse('   ')
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Ingresá un nombre.')
  })

  it('accepts up to 50 characters', () => {
    expect(parse('a'.repeat(50)).success).toBe(true)
  })

  it('rejects more than 50 characters with a message in Spanish', () => {
    const result = parse('a'.repeat(51))
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('El nombre puede tener hasta 50 caracteres.')
  })

  it('counts characters like Postgres does (code points, not UTF-16 units)', () => {
    expect(parse('🐷'.repeat(50)).success).toBe(true)
    expect(parse('🐷'.repeat(51)).success).toBe(false)
  })

  it('counts length after normalizing', () => {
    expect(parse(`  ${'a'.repeat(50)}  `).success).toBe(true)
  })

  it('requires a valid kind', () => {
    expect(CategoryInputSchema.safeParse({ name: 'Sueldo', kind: 'ingreso' }).success).toBe(false)
  })
})

describe('CategorySchema', () => {
  it('accepts a stored category', () => {
    const category = { id: '0b6f8a1e-3c1d-4f7a-9a65-2f1f0a9b8c7d', name: 'Sueldo', kind: 'income' }
    expect(CategorySchema.parse(category)).toEqual(category)
  })

  it('rejects an invalid id', () => {
    expect(CategorySchema.safeParse({ id: '1', name: 'Sueldo', kind: 'income' }).success).toBe(
      false,
    )
  })
})
