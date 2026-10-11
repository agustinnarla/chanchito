import { describe, expect, it } from 'vitest'
import { CategoryError, toCategoryError } from './errors'

describe('toCategoryError', () => {
  it('maps a unique violation to a duplicate name message for expenses', () => {
    const error = toCategoryError({ code: '23505', message: 'duplicate key' }, 'expense')

    expect(error).toBeInstanceOf(CategoryError)
    expect(error.message).toBe('Ya existe una categoría de gasto con ese nombre.')
  })

  it('maps a unique violation to a duplicate name message for income', () => {
    expect(toCategoryError({ code: '23505', message: '' }, 'income').message).toBe(
      'Ya existe una categoría de ingreso con ese nombre.',
    )
  })

  it('maps a check violation to an invalid name message', () => {
    expect(toCategoryError({ code: '23514', message: '' }, 'expense').message).toBe(
      'El nombre no es válido.',
    )
  })

  it('falls back to a generic message', () => {
    expect(
      toCategoryError({ code: '', message: 'TypeError: Failed to fetch' }, 'expense').message,
    ).toBe('No se pudo guardar. Revisá tu conexión y probá de nuevo.')
  })
})
