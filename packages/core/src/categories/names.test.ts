import { describe, expect, it } from 'vitest'
import { categoryNameKey, normalizeCategoryName, sortCategories } from './names'

describe('normalizeCategoryName', () => {
  it.each([
    ['  Comida  ', 'Comida'],
    ['Café   con  leche', 'Café con leche'],
    ['Niñera', 'Niñera'],
    ['   ', ''],
  ])('%j → %j', (input, expected) => {
    expect(normalizeCategoryName(input)).toBe(expected)
  })
})

describe('categoryNameKey', () => {
  it('ignores case and surrounding spaces', () => {
    expect(categoryNameKey(' Comida ')).toBe(categoryNameKey('comida'))
    expect(categoryNameKey('COMIDA')).toBe(categoryNameKey('Comida'))
  })

  it('does not ignore accents', () => {
    expect(categoryNameKey('Educacion')).not.toBe(categoryNameKey('Educación'))
  })
})

describe('sortCategories', () => {
  const named = (...names: string[]) => names.map((name) => ({ name }))

  it('sorts alphabetically in Spanish, ignoring case and accents', () => {
    const sorted = sortCategories(
      named('salud', 'Ñoquis', 'Alquiler', 'Educación', 'Nafta', 'expensas'),
    )
    expect(sorted.map((c) => c.name)).toEqual([
      'Alquiler',
      'Educación',
      'expensas',
      'Nafta',
      'Ñoquis',
      'salud',
    ])
  })

  it('does not mutate the original list', () => {
    const list = named('b', 'a')
    sortCategories(list)
    expect(list.map((c) => c.name)).toEqual(['b', 'a'])
  })
})
