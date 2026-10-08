import {
  categoryNameKey,
  CategoryInputSchema,
  CategoryNameSchema,
  missingSuggestedCategories,
  type Category,
  type CategoryInput,
  type CategoryKind,
} from '@chanchito/core'
import type { z } from 'zod'
import type { Tables } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import {
  CategoryError,
  duplicateNameError,
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
  toCategoryError,
} from './errors'

const COLUMNS = 'id, name, kind, archived_at'

type CategoryRow = Pick<Tables<'categories'>, 'id' | 'name' | 'kind' | 'archived_at'>

const toCategory = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  kind: row.kind,
  archived: row.archived_at !== null,
})

/** All categories, active and archived. */
export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select(COLUMNS)
  if (error) {
    throw new CategoryError('No se pudieron cargar las categorías.')
  }
  return data.map(toCategory)
}

/** Validates and normalizes the input, then creates the category. */
export async function createCategory(input: CategoryInput): Promise<Category> {
  const parsed = parseOrThrow(CategoryInputSchema, input)
  const { data, error } = await supabase.from('categories').insert(parsed).select(COLUMNS).single()
  if (error) throw await saveError(error, parsed.name, parsed.kind)
  return toCategory(data)
}

export async function renameCategory(category: Category, newName: string): Promise<Category> {
  const name = parseOrThrow(CategoryNameSchema, newName)
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', category.id)
    .select(COLUMNS)
    .single()
  if (error) throw await saveError(error, name, category.kind)
  return toCategory(data)
}

/**
 * Deletes the category, or archives it if it has movements (the database blocks deleting it).
 * An archived category with movements can't be deleted.
 */
export async function deleteCategory(category: Category): Promise<'deleted' | 'archived'> {
  const { error } = await supabase.from('categories').delete().eq('id', category.id)
  if (!error) return 'deleted'

  if (error.code !== PG_FOREIGN_KEY_VIOLATION) {
    throw new CategoryError('No se pudo eliminar la categoría. Probá de nuevo.')
  }
  if (category.archived) {
    throw new CategoryError(`«${category.name}» tiene movimientos, así que no se puede eliminar.`)
  }

  const { error: archiveError } = await supabase
    .from('categories')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', category.id)
  if (archiveError) {
    throw new CategoryError('No se pudo archivar la categoría. Probá de nuevo.')
  }
  return 'archived'
}

export async function restoreCategory(category: Category): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({ archived_at: null })
    .eq('id', category.id)
    .select(COLUMNS)
    .single()
  if (error) {
    throw new CategoryError('No se pudo restaurar la categoría. Probá de nuevo.')
  }
  return toCategory(data)
}

/** Creates the suggested categories that don't exist yet, so it never duplicates. */
export async function createSuggestedCategories(existing: Category[]): Promise<void> {
  const missing = missingSuggestedCategories(existing)
  if (missing.length === 0) return
  const { error } = await supabase.from('categories').insert(missing)
  if (error) {
    throw new CategoryError('No se pudieron crear las categorías sugeridas. Probá de nuevo.')
  }
}

/** On a duplicate name, says whether the clashing category is archived. */
async function saveError(
  error: { code: string; message: string },
  name: string,
  kind: CategoryKind,
): Promise<CategoryError> {
  if (error.code !== PG_UNIQUE_VIOLATION) return toCategoryError(error, kind)

  const { data } = await supabase.from('categories').select(COLUMNS).eq('kind', kind)
  const clash = data?.find((row) => categoryNameKey(row.name) === categoryNameKey(name))
  return duplicateNameError(kind, clash?.archived_at != null)
}

/** Parses with Zod and turns the first issue into a CategoryError. */
function parseOrThrow<T>(schema: z.ZodType<T, unknown>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new CategoryError(result.error.issues[0]?.message ?? 'El nombre no es válido.')
  }
  return result.data
}
