import { describe, expect, it } from 'vitest'
import { toContributionSaveError, toGoalSaveError } from './errors'

describe('toGoalSaveError', () => {
  it.each([
    ['23505', 'Ya tenés una meta con ese nombre.', 'duplicate'],
    ['23514', 'Algún dato de la meta no es válido. Revisalo y probá de nuevo.', 'other'],
    ['PGRST301', 'No se pudo guardar la meta. Revisá tu conexión y probá de nuevo.', 'other'],
  ])('%s → %s', (code, message, reason) => {
    expect(toGoalSaveError({ code })).toMatchObject({ message, reason })
  })
})

describe('toContributionSaveError', () => {
  it.each([
    ['23503', 'La meta ya no existe. Recargá la página.', 'goal'],
    ['23514', 'El monto no es válido. Revisalo y probá de nuevo.', 'other'],
    ['PGRST301', 'No se pudo guardar el aporte. Revisá tu conexión y probá de nuevo.', 'other'],
  ])('%s → %s', (code, message, reason) => {
    expect(toContributionSaveError({ code })).toMatchObject({ message, reason })
  })
})
