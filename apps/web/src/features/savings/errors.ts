/** Why saving a goal or a contribution failed; the form uses it to point at the right field. */
export type SavingsErrorReason = 'duplicate' | 'goal' | 'other'

/** Error with a user-facing message in Spanish. */
export class SavingsError extends Error {
  override readonly name = 'SavingsError'

  constructor(
    message: string,
    readonly reason: SavingsErrorReason = 'other',
  ) {
    super(message)
  }
}

const PG_UNIQUE_VIOLATION = '23505'
const PG_FOREIGN_KEY_VIOLATION = '23503'
const PG_CHECK_VIOLATION = '23514'

/** Translates a PostgREST error on saving a goal into a message for the user. */
export function toGoalSaveError(error: { code: string }): SavingsError {
  switch (error.code) {
    case PG_UNIQUE_VIOLATION:
      return new SavingsError('Ya tenés una meta con ese nombre.', 'duplicate')
    case PG_CHECK_VIOLATION:
      return new SavingsError('Algún dato de la meta no es válido. Revisalo y probá de nuevo.')
    default:
      return new SavingsError('No se pudo guardar la meta. Revisá tu conexión y probá de nuevo.')
  }
}

/** Translates a PostgREST error on saving a contribution into a message for the user. */
export function toContributionSaveError(error: { code: string }): SavingsError {
  switch (error.code) {
    case PG_FOREIGN_KEY_VIOLATION:
      return new SavingsError('La meta ya no existe. Recargá la página.', 'goal')
    case PG_CHECK_VIOLATION:
      return new SavingsError('El monto no es válido. Revisalo y probá de nuevo.')
    default:
      return new SavingsError('No se pudo guardar el aporte. Revisá tu conexión y probá de nuevo.')
  }
}
