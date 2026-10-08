/** Trims and collapses any run of whitespace into a single space. */
export function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

/**
 * Comparison key for uniqueness: same as the database index `lower(name)`.
 * Ignores case but not accents ("Educacion" and "Educación" are different names).
 */
export function categoryNameKey(name: string): string {
  return normalizeCategoryName(name).toLowerCase()
}

const collator = new Intl.Collator('es', { sensitivity: 'base' })

/** Returns a new list sorted alphabetically in Spanish, ignoring case and accents. */
export function sortCategories<T extends { name: string }>(categories: readonly T[]): T[] {
  return [...categories].sort((a, b) => collator.compare(a.name, b.name))
}
