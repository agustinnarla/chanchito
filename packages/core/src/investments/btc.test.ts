import { describe, expect, it } from 'vitest'
import { formatBtc, formatBtcForInput, parseBtc, purchasePrice, valueOf } from './btc'

describe('parseBtc', () => {
  it.each([
    ['0,0125', 1250000],
    ['0.0125', 1250000],
    ['1', 100000000],
    ['0,00000001', 1],
    [' 2,5 ', 250000000],
  ])('%j → %i sats', (input, sats) => {
    expect(parseBtc(input)).toBe(sats)
  })

  it.each([
    ['', 'Ingresá una cantidad.'],
    ['0', 'La cantidad tiene que ser mayor a 0.'],
    ['0,00000000', 'La cantidad tiene que ser mayor a 0.'],
    ['0,000000001', 'La cantidad puede tener hasta 8 decimales.'],
    ['-0,01', 'La cantidad no puede ser negativa.'],
    ['abc', 'La cantidad no es válida. Usá el formato 0,0125.'],
    ['1,2,3', 'La cantidad no es válida. Usá el formato 0,0125.'],
    ['1.000,5', 'La cantidad no es válida. Usá el formato 0,0125.'],
    ['999999999', 'La cantidad es demasiado grande.'],
  ])('%j → %s', (input, message) => {
    expect(parseBtc(input)).toBe(message)
  })
})

describe('formatBtc', () => {
  it.each([
    [1250000, '0,0125 BTC'],
    [100000000, '1 BTC'],
    [1, '0,00000001 BTC'],
    [123456789012, '1.234,56789012 BTC'],
    [0, '0 BTC'],
  ])('%i → %s', (sats, expected) => {
    expect(formatBtc(sats)).toBe(expected)
  })

  it('writes it back as the form expects', () => {
    expect(formatBtcForInput(1250000)).toBe('0,0125')
    expect(formatBtcForInput(100000000)).toBe('1')
  })
})

describe('valueOf', () => {
  it('multiplies the price of one bitcoin by the satoshis, rounding to the cent', () => {
    const price = { amount: 13269720200, currency: 'ARS' } as const // $ 132.697.202
    expect(valueOf(1250000, price)).toEqual({ amount: 165871503, currency: 'ARS' }) // $ 1.658.715,025
    expect(valueOf(1, price)).toEqual({ amount: 133, currency: 'ARS' }) // $ 1,326972
    expect(valueOf(0, price)).toEqual({ amount: 0, currency: 'ARS' })
  })

  it('stays exact with large amounts', () => {
    const price = { amount: 5_000_000_000_000_000, currency: 'ARS' } as const
    expect(valueOf(100_000_000, price).amount).toBe(5_000_000_000_000_000)
    expect(() => valueOf(200_000_000, price)).toThrow('El monto es demasiado grande.')
  })
})

describe('purchasePrice', () => {
  it('is what one bitcoin cost in that purchase', () => {
    expect(purchasePrice(350000, { amount: 49000000, currency: 'ARS' })).toEqual({
      amount: 14000000000, // $ 140.000.000
      currency: 'ARS',
    })
    expect(purchasePrice(3, { amount: 100, currency: 'ARS' }).amount).toBe(3333333333)
  })
})
