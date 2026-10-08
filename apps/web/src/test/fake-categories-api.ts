import {
  categoryNameKey,
  CategoryInputSchema,
  CategoryNameSchema,
  missingSuggestedCategories,
  type Category,
  type CategoryInput,
} from '@chanchito/core'
import { vi } from 'vitest'
import { CategoryError } from '@/features/categories/errors'

/**
 * In-memory stand-in for `features/categories/api`, with the same rules as the database:
 * normalized names and unique (kind, name) ignoring case.
 */
export function createFakeCategoriesApi() {
  let categories: Category[] = []
  let nextId = 1

  const assertUnique = (name: string, kind: Category['kind'], exceptId?: string) => {
    const clash = categories.some(
      (c) =>
        c.id !== exceptId && c.kind === kind && categoryNameKey(c.name) === categoryNameKey(name),
    )
    if (clash) {
      const label = kind === 'expense' ? 'gasto' : 'ingreso'
      throw new CategoryError(`Ya existe una categoría de ${label} con ese nombre.`)
    }
  }

  const parse = <T>(
    result:
      { success: true; data: T } | { success: false; error: { issues: { message: string }[] } },
  ) => {
    if (!result.success) throw new CategoryError(result.error.issues[0]?.message ?? 'Inválido')
    return result.data
  }

  const insert = (input: CategoryInput): Category => {
    assertUnique(input.name, input.kind)
    const category = {
      id: `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`,
      ...input,
    }
    categories.push(category)
    return category
  }

  return {
    reset(initial: CategoryInput[] = []) {
      categories = []
      nextId = 1
      initial.forEach(insert)
      vi.clearAllMocks()
    },
    all: () => [...categories],
    listCategories: vi.fn(async () => [...categories]),
    createCategory: vi.fn(async (input: CategoryInput) =>
      insert(parse(CategoryInputSchema.safeParse(input))),
    ),
    renameCategory: vi.fn(async (category: Category, newName: string) => {
      const name = parse(CategoryNameSchema.safeParse(newName))
      assertUnique(name, category.kind, category.id)
      categories = categories.map((c) => (c.id === category.id ? { ...c, name } : c))
      return { ...category, name }
    }),
    deleteCategory: vi.fn(async (category: Category) => {
      categories = categories.filter((c) => c.id !== category.id)
    }),
    createSuggestedCategories: vi.fn(async (existing: Category[]) => {
      missingSuggestedCategories(existing).forEach(insert)
    }),
  }
}
