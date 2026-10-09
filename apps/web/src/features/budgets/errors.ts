/** Why saving a budget failed; the form uses it to point at the right field. */
export type BudgetErrorReason = 'duplicate' | 'category' | 'other'

/** Error with a user-facing message in Spanish. */
export class BudgetError extends Error {
  override readonly name = 'BudgetError'

  constructor(
    message: string,
    readonly reason: BudgetErrorReason = 'other',
  ) {
    super(message)
  }
}

const PG_UNIQUE_VIOLATION = '23505'
const PG_FOREIGN_KEY_VIOLATION = '23503'
const PG_CHECK_VIOLATION = '23514'

/** Translates a PostgREST error on insert or update into a message for the user. */
export function toBudgetSaveError(error: { code: string }): BudgetError {
  switch (error.code) {
    case PG_UNIQUE_VIOLATION:
      return new BudgetError(
        'Ya hay un presupuesto para esa categoría y moneda en este mes.',
        'duplicate',
      )
    case PG_FOREIGN_KEY_VIOLATION:
      return new BudgetError('La categoría elegida ya no existe. Elegí otra.', 'category')
    case PG_CHECK_VIOLATION:
      return new BudgetError('Algún dato del presupuesto no es válido. Revisalo y probá de nuevo.')
    default:
      return new BudgetError(
        'No se pudo guardar el presupuesto. Revisá tu conexión y probá de nuevo.',
      )
  }
}

/** Copying fails as a whole; a duplicate means the month got budgets in the meantime. */
export function toBudgetCopyError(error: { code: string }): BudgetError {
  return error.code === PG_UNIQUE_VIOLATION
    ? new BudgetError('Este mes ya tiene presupuestos. Recargá la página.', 'duplicate')
    : new BudgetError('No se pudieron copiar los presupuestos. Probá de nuevo.')
}
