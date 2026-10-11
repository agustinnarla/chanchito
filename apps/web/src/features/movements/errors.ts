/** Error with a user-facing message in Spanish. */
export class MovementError extends Error {
  override readonly name = 'MovementError'
}

const PG_FOREIGN_KEY_VIOLATION = '23503'
const PG_CHECK_VIOLATION = '23514'

/** Translates a PostgREST error on insert or update into a message for the user. */
export function toMovementSaveError(error: { code: string }): MovementError {
  switch (error.code) {
    case PG_FOREIGN_KEY_VIOLATION:
      return new MovementError('La categoría elegida ya no existe. Elegí otra.')
    case PG_CHECK_VIOLATION:
      return new MovementError('Algún dato del movimiento no es válido. Revisalo y probá de nuevo.')
    default:
      return new MovementError(
        'No se pudo guardar el movimiento. Revisá tu conexión y probá de nuevo.',
      )
  }
}
