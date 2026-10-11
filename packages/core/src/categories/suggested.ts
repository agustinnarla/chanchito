import { categoryNameKey } from './names'
import type { CategoryInput } from './types'

export const SUGGESTED_CATEGORIES: readonly CategoryInput[] = [
  { name: 'Supermercado', kind: 'expense' },
  { name: 'Alquiler', kind: 'expense' },
  { name: 'Expensas', kind: 'expense' },
  { name: 'Servicios', kind: 'expense' },
  { name: 'Transporte', kind: 'expense' },
  { name: 'Salud', kind: 'expense' },
  { name: 'Salidas', kind: 'expense' },
  { name: 'Compras', kind: 'expense' },
  { name: 'Educación', kind: 'expense' },
  { name: 'Suscripciones', kind: 'expense' },
  { name: 'Otros gastos', kind: 'expense' },
  { name: 'Sueldo', kind: 'income' },
  { name: 'Freelance', kind: 'income' },
  { name: 'Otros ingresos', kind: 'income' },
]

/** Suggestions that don't exist yet (same kind and name, ignoring case). */
export function missingSuggestedCategories(
  existing: readonly Pick<CategoryInput, 'name' | 'kind'>[],
): CategoryInput[] {
  const taken = new Set(existing.map((c) => `${c.kind}:${categoryNameKey(c.name)}`))
  return SUGGESTED_CATEGORIES.filter((c) => !taken.has(`${c.kind}:${categoryNameKey(c.name)}`))
}
