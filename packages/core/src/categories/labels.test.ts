import { describe, expect, it } from 'vitest'
import { CATEGORY_KIND_LABELS } from './labels'

describe('CATEGORY_KIND_LABELS', () => {
  it('has a Spanish label for each kind', () => {
    expect(CATEGORY_KIND_LABELS).toEqual({ expense: 'Gasto', income: 'Ingreso' })
  })
})
