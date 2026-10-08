import { CATEGORY_KIND_LABELS, type CategoryKind } from '@chanchito/core'

/** Error with a user-facing message in Spanish. */
export class CategoryError extends Error {
  override readonly name = 'CategoryError'
}

const UNIQUE_VIOLATION = '23505'
const CHECK_VIOLATION = '23514'

/** Translates a PostgREST error into a message for the user. */
export function toCategoryError(
  error: { code: string; message: string },
  kind: CategoryKind,
): CategoryError {
  switch (error.code) {
    case UNIQUE_VIOLATION:
      return new CategoryError(
        `Ya existe una categoría de ${CATEGORY_KIND_LABELS[kind].toLowerCase()} con ese nombre.`,
      )
    case CHECK_VIOLATION:
      return new CategoryError('El nombre no es válido.')
    default:
      return new CategoryError('No se pudo guardar. Revisá tu conexión y probá de nuevo.')
  }
}
