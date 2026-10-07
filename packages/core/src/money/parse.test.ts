import { describe, expect, it } from 'vitest'
import { MoneyError } from './errors'
import { parseMoney } from './parse'

function expectError(input: string, code: MoneyError['code']) {
  expect(() => parseMoney(input, 'ARS')).toThrow(
    expect.objectContaining({ name: 'MoneyError', code }),
  )
}

describe('parseMoney', () => {
  describe('acceptance criteria', () => {
    it('parses Argentine format with thousands and decimals', () => {
      expect(parseMoney('1.234,56', 'ARS')).toEqual({ amount: 123456, currency: 'ARS' })
    })

    it('parses a dot as decimal separator', () => {
      expect(parseMoney('1234.5', 'USD')).toEqual({ amount: 123450, currency: 'USD' })
    })

    it('rejects more than 2 decimals', () => {
      expectError('12,345', 'too_many_decimals')
    })
  })

  describe('integers', () => {
    it.each([
      ['1234', 123400],
      ['0', 0],
      ['007', 700],
    ])('%s → %i cents', (input, amount) => {
      expect(parseMoney(input, 'ARS').amount).toBe(amount)
    })
  })

  describe('comma: always the decimal separator', () => {
    it.each([
      ['1234,5', 123450],
      ['1234,56', 123456],
      ['0,05', 5],
      ['1.234.567,8', 123456780],
    ])('%s → %i cents', (input, amount) => {
      expect(parseMoney(input, 'ARS').amount).toBe(amount)
    })
  })

  describe('dot without comma: thousands if every group after the first has exactly 3 digits', () => {
    it.each([
      // Ambiguous on purpose: "1.234" is one thousand two hundred thirty-four, not 1,234.
      ['1.234', 123400],
      ['12.345', 1234500],
      ['1.234.567', 123456700],
    ])('%s is thousands → %i cents', (input, amount) => {
      expect(parseMoney(input, 'ARS').amount).toBe(amount)
    })

    it.each([
      ['1234.56', 123456],
      ['12.5', 1250],
      ['1.23', 123],
    ])('%s is decimal → %i cents', (input, amount) => {
      expect(parseMoney(input, 'ARS').amount).toBe(amount)
    })
  })

  describe('whitespace', () => {
    it('ignores leading and trailing spaces', () => {
      expect(parseMoney('  12,30  ', 'ARS').amount).toBe(1230)
    })

    it('rejects inner spaces', () => {
      expectError('12 345', 'invalid_format')
    })
  })

  describe('large amounts', () => {
    it('keeps precision for 1.000.000.000,00', () => {
      expect(parseMoney('1.000.000.000,00', 'ARS').amount).toBe(100_000_000_000)
    })

    it('accepts the largest safe amount', () => {
      expect(parseMoney('90071992547409,91', 'ARS').amount).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('rejects amounts beyond the safe integer range', () => {
      expectError('90071992547409,92', 'too_large')
      expectError('99999999999999999999', 'too_large')
    })
  })

  describe('errors', () => {
    it.each(['', '   '])('empty input %j', (input) => {
      expectError(input, 'empty')
    })

    it.each(['-5', '-1.234,56'])('negative %s', (input) => {
      expectError(input, 'negative')
    })

    it.each([
      'abc',
      '12a',
      '+5',
      '$100',
      // only separators
      '.',
      ',',
      '.,',
      // separator without a digit before
      ',5',
      '.5',
      // trailing separator
      '1234,',
      '1234.',
      // US format
      '1,234.56',
      // bad thousands grouping
      '1.23.456',
      '1234.567,5',
      '1.2345,6',
      // more than one comma
      '1,2,3',
    ])('invalid format %j', (input) => {
      expectError(input, 'invalid_format')
    })

    it.each(['12.3456', '1.234,567', '1234.567'])('too many decimals %s', (input) => {
      expectError(input, 'too_many_decimals')
    })

    it('has a message in Spanish', () => {
      expect(() => parseMoney('12,345', 'ARS')).toThrow('El monto puede tener hasta 2 decimales.')
    })
  })
})
