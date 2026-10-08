import {
  categoryNameKey,
  CategoryInputSchema,
  CategoryNameSchema,
  missingSuggestedCategories,
  type Category,
  type CategoryInput,
  type CategoryKind,
} from '@chanchito/core'
import { vi } from 'vitest'
import { CategoryError, duplicateNameError } from '@/features/categories/errors'

/** A movement as stored in the fake database (enough to know which categories are in use). */
export type FakeMovementRow = { id: string; categoryId: string }

export type FakeSeed = {
  categories?: (CategoryInput & { archived?: boolean })[]
  /** Category names that have movements (their categories can't be deleted, only archived). */
  categoriesWithMovements?: string[]
}

/**
 * In-memory stand-in for the data layer (`features/*\/api.ts`) with the same rules as the
 * database: normalized and unique names, and categories with movements can't be deleted.
 * One shared instance per test file, so the mocked APIs see the same data.
 */
function createFakeDb() {
  let categories: Category[] = []
  let movements: FakeMovementRow[] = []
  let nextId = 1

  const newId = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`

  const parse = <T>(
    result:
      { success: true; data: T } | { success: false; error: { issues: { message: string }[] } },
  ) => {
    if (!result.success) throw new CategoryError(result.error.issues[0]?.message ?? 'Inválido')
    return result.data
  }

  const assertUnique = (name: string, kind: CategoryKind, exceptId?: string) => {
    const clash = categories.find(
      (c) =>
        c.id !== exceptId && c.kind === kind && categoryNameKey(c.name) === categoryNameKey(name),
    )
    if (clash) throw duplicateNameError(kind, clash.archived)
  }

  const insertCategory = (input: CategoryInput, archived = false): Category => {
    assertUnique(input.name, input.kind)
    const category = { id: newId(), name: input.name, kind: input.kind, archived }
    categories.push(category)
    return category
  }

  const categoriesApi = {
    listCategories: vi.fn(async () => categories.map((c) => ({ ...c }))),
    createCategory: vi.fn(async (input: CategoryInput) =>
      insertCategory(parse(CategoryInputSchema.safeParse(input))),
    ),
    renameCategory: vi.fn(async (category: Category, newName: string) => {
      const name = parse(CategoryNameSchema.safeParse(newName))
      assertUnique(name, category.kind, category.id)
      categories = categories.map((c) => (c.id === category.id ? { ...c, name } : c))
      return { ...category, name }
    }),
    deleteCategory: vi.fn(async (category: Category): Promise<'deleted' | 'archived'> => {
      if (!movements.some((m) => m.categoryId === category.id)) {
        categories = categories.filter((c) => c.id !== category.id)
        return 'deleted'
      }
      if (category.archived) {
        throw new CategoryError(
          `«${category.name}» tiene movimientos, así que no se puede eliminar.`,
        )
      }
      categories = categories.map((c) => (c.id === category.id ? { ...c, archived: true } : c))
      return 'archived'
    }),
    restoreCategory: vi.fn(async (category: Category) => {
      categories = categories.map((c) => (c.id === category.id ? { ...c, archived: false } : c))
      return { ...category, archived: false }
    }),
    createSuggestedCategories: vi.fn(async (existing: Category[]) => {
      missingSuggestedCategories(existing).forEach((input) => insertCategory(input))
    }),
  }

  return {
    reset(seed: FakeSeed = {}) {
      categories = []
      movements = []
      nextId = 1
      for (const { archived, ...input } of seed.categories ?? []) insertCategory(input, archived)
      for (const name of seed.categoriesWithMovements ?? []) {
        const category = categories.find((c) => c.name === name)
        if (!category) throw new Error(`Unknown category in seed: ${name}`)
        movements.push({ id: newId(), categoryId: category.id })
      }
      vi.clearAllMocks()
    },
    categories: () => categories.map((c) => ({ ...c })),
    categoriesApi,
  }
}

export const fakeDb = createFakeDb()
