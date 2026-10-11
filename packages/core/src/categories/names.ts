import { normalizeSpaces } from '../text'

/** Trims and collapses any run of whitespace into a single space. */
export function normalizeCategoryName(name: string): string {
  return normalizeSpaces(name)
}

/**
 * Comparison key for uniqueness: same as the database index `lower(name)`.
 * Ignores case but not accents ("Educacion" and "Educación" are different names).
 */
export function categoryNameKey(name: string): string {
  return normalizeCategoryName(name).toLowerCase()
}

const collator = new Intl.Collator('es', { sensitivity: 'base' })

/** Alphabetical order in Spanish, ignoring case and accents. */
export function compareCategoryNames(a: string, b: string): number {
  return collator.compare(a, b)
}

/** Returns a new list sorted alphabetically in Spanish, ignoring case and accents. */
export function sortCategories<T extends { name: string }>(categories: readonly T[]): T[] {
  return [...categories].sort((a, b) => compareCategoryNames(a.name, b.name))
}
