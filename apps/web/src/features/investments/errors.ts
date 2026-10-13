/** Error with a user-facing message in Spanish. */
export class InvestmentError extends Error {
  override readonly name = 'InvestmentError'
}

const PG_CHECK_VIOLATION = '23514'

/** Translates a PostgREST error on saving a purchase into a message for the user. */
export function toPurchaseSaveError(error: { code: string }): InvestmentError {
  return error.code === PG_CHECK_VIOLATION
    ? new InvestmentError('Algún dato de la compra no es válido. Revisalo y probá de nuevo.')
    : new InvestmentError('No se pudo guardar la compra. Revisá tu conexión y probá de nuevo.')
}
