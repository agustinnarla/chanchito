import { CATEGORY_KIND_LABELS, type CategoryKind } from '@chanchito/core'

/** Error with a user-facing message in Spanish. */
export class CategoryError extends Error {
  override readonly name = 'CategoryError'
}

export const PG_UNIQUE_VIOLATION = '23505'
export const PG_CHECK_VIOLATION = '23514'
export const PG_FOREIGN_KEY_VIOLATION = '23503'

const kindLabel = (kind: CategoryKind) => CATEGORY_KIND_LABELS[kind].toLowerCase()

export function duplicateNameError(kind: CategoryKind, clashesWithArchived = false) {
  return new CategoryError(
    clashesWithArchived
      ? `Ya existe una categoría de ${kindLabel(kind)} archivada con ese nombre. Restaurala desde «Archivadas».`
      : `Ya existe una categoría de ${kindLabel(kind)} con ese nombre.`,
  )
}

/** Translates a PostgREST error into a message for the user. */
export function toCategoryError(
  error: { code: string; message: string },
  kind: CategoryKind,
): CategoryError {
  switch (error.code) {
    case PG_UNIQUE_VIOLATION:
      return duplicateNameError(kind)
    case PG_CHECK_VIOLATION:
      return new CategoryError('El nombre no es válido.')
    default:
      return new CategoryError('No se pudo guardar. Revisá tu conexión y probá de nuevo.')
  }
}
