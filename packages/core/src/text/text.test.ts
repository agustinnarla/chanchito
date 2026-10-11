import { describe, expect, it } from 'vitest'
import { characterCount, normalizeSpaces } from './text'

describe('normalizeSpaces', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeSpaces(' \tCafé \n  con   leche ')).toBe('Café con leche')
  })
})

describe('characterCount', () => {
  it('counts code points', () => {
    expect(characterCount('Niñera')).toBe(6)
    expect(characterCount('🐷🐷')).toBe(2)
  })
})
