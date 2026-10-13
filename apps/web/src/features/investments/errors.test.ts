import { describe, expect, it } from 'vitest'
import { toPurchaseSaveError } from './errors'

describe('toPurchaseSaveError', () => {
  it.each([
    ['23514', 'Algún dato de la compra no es válido. Revisalo y probá de nuevo.'],
    ['PGRST301', 'No se pudo guardar la compra. Revisá tu conexión y probá de nuevo.'],
  ])('%s → %s', (code, message) => {
    expect(toPurchaseSaveError({ code }).message).toBe(message)
  })
})
