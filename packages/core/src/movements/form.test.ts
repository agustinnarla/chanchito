import { describe, expect, it } from 'vitest'
import { parseMovementForm, type MovementFormValues } from './form'

const CATEGORY_ID = '0b6f8a1e-3c1d-4f7a-9a65-2f1f0a9b8c7d'

const valid: MovementFormValues = {
  amount: '1.234,56',
  currency: 'ARS',
  occurredOn: '2026-10-07',
  categoryId: CATEGORY_ID,
  description: '  Compra   del mes ',
}

describe('parseMovementForm', () => {
  it('turns valid form values into a movement input', () => {
    expect(parseMovementForm(valid)).toEqual({
      ok: true,
      data: {
        amount: { amount: 123456, currency: 'ARS' },
        occurredOn: '2026-10-07',
        categoryId: CATEGORY_ID,
        description: 'Compra del mes',
      },
    })
  })

  it('stores an empty or blank description as null', () => {
    for (const description of ['', '   ']) {
      const result = parseMovementForm({ ...valid, description })
      expect(result.ok && result.data.description).toBeNull()
    }
  })

  it('accepts a description of 100 characters', () => {
    expect(parseMovementForm({ ...valid, description: 'a'.repeat(100) }).ok).toBe(true)
  })

  it('rejects a description longer than 100 characters', () => {
    expect(parseMovementForm({ ...valid, description: 'a'.repeat(101) })).toEqual({
      ok: false,
      errors: { description: 'La descripción puede tener hasta 100 caracteres.' },
    })
  })

  it.each([
    ['', 'Ingresá un monto.'],
    ['0', 'El monto tiene que ser mayor a 0.'],
    ['0,00', 'El monto tiene que ser mayor a 0.'],
    ['-5', 'El monto no puede ser negativo.'],
    ['12,345', 'El monto puede tener hasta 2 decimales.'],
    ['abc', 'El monto no es válido. Usá el formato 1.234,56.'],
  ])('rejects the amount %j with %j', (amount, message) => {
    expect(parseMovementForm({ ...valid, amount })).toEqual({
      ok: false,
      errors: { amount: message },
    })
  })

  it('keeps the chosen currency', () => {
    const result = parseMovementForm({ ...valid, amount: '100', currency: 'USD' })
    expect(result.ok && result.data.amount).toEqual({ amount: 10000, currency: 'USD' })
  })

  it('requires a category', () => {
    expect(parseMovementForm({ ...valid, categoryId: '' })).toEqual({
      ok: false,
      errors: { categoryId: 'Elegí una categoría.' },
    })
  })

  it.each(['', '2026-02-30', 'hoy'])('rejects the date %j', (occurredOn) => {
    expect(parseMovementForm({ ...valid, occurredOn })).toEqual({
      ok: false,
      errors: { occurredOn: 'Ingresá una fecha válida.' },
    })
  })

  it('reports every invalid field at once', () => {
    const result = parseMovementForm({
      amount: '',
      currency: 'ARS',
      occurredOn: '',
      categoryId: '',
      description: 'a'.repeat(101),
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual([
      'amount',
      'categoryId',
      'description',
      'occurredOn',
    ])
  })
})
