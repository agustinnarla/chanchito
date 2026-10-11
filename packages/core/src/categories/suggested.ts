import { categoryNameKey } from './names'
import type { CategoryEmoji } from './emojis'
import type { CategoryInput } from './types'

export const SUGGESTED_CATEGORIES: readonly (CategoryInput & { emoji: CategoryEmoji })[] = [
  { name: 'Supermercado', kind: 'expense', emoji: 'shopping_cart' },
  { name: 'Alquiler', kind: 'expense', emoji: 'house' },
  { name: 'Expensas', kind: 'expense', emoji: 'office_building' },
  { name: 'Servicios', kind: 'expense', emoji: 'light_bulb' },
  { name: 'Transporte', kind: 'expense', emoji: 'bus' },
  { name: 'Salud', kind: 'expense', emoji: 'pill' },
  { name: 'Salidas', kind: 'expense', emoji: 'clinking_beer_mugs' },
  { name: 'Compras', kind: 'expense', emoji: 'shopping_bags' },
  { name: 'Educación', kind: 'expense', emoji: 'books' },
  { name: 'Suscripciones', kind: 'expense', emoji: 'television' },
  { name: 'Otros gastos', kind: 'expense', emoji: 'package' },
  { name: 'Sueldo', kind: 'income', emoji: 'briefcase' },
  { name: 'Freelance', kind: 'income', emoji: 'laptop' },
  { name: 'Otros ingresos', kind: 'income', emoji: 'money_bag' },
]

/** Suggestions that don't exist yet (same kind and name, ignoring case). */
export function missingSuggestedCategories(
  existing: readonly Pick<CategoryInput, 'name' | 'kind'>[],
): CategoryInput[] {
  const taken = new Set(existing.map((c) => `${c.kind}:${categoryNameKey(c.name)}`))
  return SUGGESTED_CATEGORIES.filter((c) => !taken.has(`${c.kind}:${categoryNameKey(c.name)}`))
}
