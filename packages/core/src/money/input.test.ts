import { describe, expect, it } from 'vitest'
import { formatAmountForInput } from './input'
import { parseMoney } from './parse'

describe('formatAmountForInput', () => {
  it.each([
    [123456, '1234,56'],
    [10000, '100'],
    [10050, '100,50'],
    [5, '0,05'],
    [100_000_000_000, '1000000000'],
  ])('%i cents → %j', (cents, text) => {
    expect(formatAmountForInput(cents)).toBe(text)
  })

  it('round-trips through parseMoney', () => {
    for (const cents of [1, 99, 100, 123456, Number.MAX_SAFE_INTEGER]) {
      expect(parseMoney(formatAmountForInput(cents), 'ARS').amount).toBe(cents)
    }
  })
})
