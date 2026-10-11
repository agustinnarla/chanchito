import { describe, expect, it } from 'vitest'
import { parseBudgetForm, type BudgetFormValues } from './form'

const CATEGORY_ID = '0b6f8a1e-3c1d-4f7a-9a65-2f1f0a9b8c7d'

const valid: BudgetFormValues = { categoryId: CATEGORY_ID, currency: 'ARS', amount: '60.000' }

describe('parseBudgetForm', () => {
  it('turns valid form values into a budget input for the month', () => {
    expect(parseBudgetForm(valid, '2026-10')).toEqual({
      ok: true,
      data: {
        categoryId: CATEGORY_ID,
        month: '2026-10',
        amount: { amount: 6000000, currency: 'ARS' },
      },
    })
  })

  it('keeps the chosen currency', () => {
    const result = parseBudgetForm({ ...valid, amount: '100,50', currency: 'USD' }, '2026-10')
    expect(result.ok && result.data.amount).toEqual({ amount: 10050, currency: 'USD' })
  })

  it.each([
    ['', 'Ingresá un monto.'],
    ['0', 'El monto tiene que ser mayor a 0.'],
    ['-5', 'El monto no puede ser negativo.'],
    ['12,345', 'El monto puede tener hasta 2 decimales.'],
  ])('rejects the amount %j with %j', (amount, message) => {
    expect(parseBudgetForm({ ...valid, amount }, '2026-10')).toEqual({
      ok: false,
      errors: { amount: message },
    })
  })

  it('requires a category', () => {
    expect(parseBudgetForm({ ...valid, categoryId: '' }, '2026-10')).toEqual({
      ok: false,
      errors: { categoryId: 'Elegí una categoría.' },
    })
  })

  it('reports every invalid field at once', () => {
    expect(parseBudgetForm({ categoryId: '', currency: 'ARS', amount: '' }, '2026-10')).toEqual({
      ok: false,
      errors: { categoryId: 'Elegí una categoría.', amount: 'Ingresá un monto.' },
    })
  })
})
