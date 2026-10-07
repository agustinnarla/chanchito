import {
  CategoryInputSchema,
  CategoryNameSchema,
  missingSuggestedCategories,
  sortCategories,
  type Category,
  type CategoryInput,
  type CategoryKind,
} from '@chanchito/core'
import type { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { CategoryError, toCategoryError } from './errors'

const COLUMNS = 'id, name, kind'

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select(COLUMNS)
  if (error) {
    throw new CategoryError('No se pudieron cargar las categorías.')
  }
  return sortCategories(data)
}

/** Validates and normalizes the input, then creates the category. */
export async function createCategory(input: CategoryInput): Promise<Category> {
  const parsed = parseOrThrow(CategoryInputSchema, input)
  const { data, error } = await supabase.from('categories').insert(parsed).select(COLUMNS).single()
  if (error) throw toCategoryError(error, parsed.kind)
  return data
}

export async function renameCategory(category: Category, newName: string): Promise<Category> {
  const name = parseOrThrow(CategoryNameSchema, newName)
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', category.id)
    .select(COLUMNS)
    .single()
  if (error) throw toCategoryError(error, category.kind)
  return data
}

export async function deleteCategory(category: Category): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', category.id)
  if (error) {
    throw new CategoryError('No se pudo eliminar la categoría. Probá de nuevo.')
  }
}

/** Creates the suggested categories that don't exist yet, so it never duplicates. */
export async function createSuggestedCategories(existing: Category[]): Promise<void> {
  const missing = missingSuggestedCategories(existing)
  if (missing.length === 0) return
  const { error } = await supabase.from('categories').insert(missing)
  if (error) throw toCategoryError(error, firstKind(missing))
}

function firstKind(categories: CategoryInput[]): CategoryKind {
  return categories[0]?.kind ?? 'expense'
}

/** Parses with Zod and turns the first issue into a CategoryError. */
function parseOrThrow<T>(schema: z.ZodType<T, unknown>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new CategoryError(result.error.issues[0]?.message ?? 'El nombre no es válido.')
  }
  return result.data
}
