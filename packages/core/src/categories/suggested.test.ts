import { describe, expect, it } from 'vitest'
import { CategoryInputSchema } from './schema'
import { missingSuggestedCategories, SUGGESTED_CATEGORIES } from './suggested'

describe('SUGGESTED_CATEGORIES', () => {
  it('has 11 expense and 3 income categories', () => {
    expect(SUGGESTED_CATEGORIES.filter((c) => c.kind === 'expense')).toHaveLength(11)
    expect(SUGGESTED_CATEGORIES.filter((c) => c.kind === 'income')).toHaveLength(3)
  })

  it('are all valid category inputs', () => {
    for (const category of SUGGESTED_CATEGORIES) {
      expect(CategoryInputSchema.parse(category)).toEqual(category)
    }
  })
})

describe('missingSuggestedCategories', () => {
  it('returns all suggestions when there are no categories', () => {
    expect(missingSuggestedCategories([])).toEqual(SUGGESTED_CATEGORIES)
  })

  it('skips the ones that already exist with the same kind, ignoring case', () => {
    const missing = missingSuggestedCategories([
      { name: 'sueldo', kind: 'income' },
      { name: 'SUPERMERCADO', kind: 'expense' },
    ])

    expect(missing).toHaveLength(SUGGESTED_CATEGORIES.length - 2)
    expect(missing).not.toContainEqual({ name: 'Sueldo', kind: 'income' })
    expect(missing).not.toContainEqual({ name: 'Supermercado', kind: 'expense' })
  })

  it('does not skip a suggestion that exists with the other kind', () => {
    const missing = missingSuggestedCategories([{ name: 'Sueldo', kind: 'expense' }])

    expect(missing).toContainEqual({ name: 'Sueldo', kind: 'income' })
  })

  it('returns nothing when all suggestions exist', () => {
    expect(missingSuggestedCategories(SUGGESTED_CATEGORIES)).toEqual([])
  })
})
