import { describe, expect, it } from 'vitest'
import { MovementError, toMovementSaveError } from './errors'

describe('toMovementSaveError', () => {
  it('maps a foreign key violation to a missing category message', () => {
    const error = toMovementSaveError({ code: '23503' })

    expect(error).toBeInstanceOf(MovementError)
    expect(error.message).toBe('La categoría elegida ya no existe. Elegí otra.')
  })

  it('maps a check violation to an invalid data message', () => {
    expect(toMovementSaveError({ code: '23514' }).message).toBe(
      'Algún dato del movimiento no es válido. Revisalo y probá de nuevo.',
    )
  })

  it('falls back to a generic message', () => {
    expect(toMovementSaveError({ code: '' }).message).toBe(
      'No se pudo guardar el movimiento. Revisá tu conexión y probá de nuevo.',
    )
  })
})
