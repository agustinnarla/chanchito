import {
  categoryNameKey,
  CategoryEmojiSchema,
  CategoryInputSchema,
  CategoryNameSchema,
  missingSuggestedCategories,
  monthRange,
  type Category,
  type CategoryInput,
  type CategoryKind,
  type Currency,
  type Month,
  type Movement,
  type MovementInput,
} from '@chanchito/core'
import type { CategoriesApi } from '../categories/api'
import { CategoryError, duplicateNameError } from '../categories/errors'
import type { MovementsApi } from '../movements/api'
import { MovementError } from '../movements/errors'

type MovementRow = MovementInput & { id: string; createdAt: string }

export type FakeMovementSeed = {
  /** Name of a seeded category. */
  category: string
  amount?: number
  currency?: Currency
  occurredOn?: string
  description?: string | null
}

export type FakeDataSeed = {
  categories?: (CategoryInput & { archived?: boolean })[]
  movements?: FakeMovementSeed[]
}

/**
 * In-memory stand-in for the categories and movements data layer, with the same rules and
 * messages as the database: normalized and unique names, movements need an existing category and
 * categories with movements are archived instead of deleted. Offline, every call fails like the
 * real one does without a connection. For screen tests in any runner (it doesn't use mocks).
 */
export function createFakeData() {
  let categories: Category[] = []
  let movements: MovementRow[] = []
  let offline = false
  let nextId = 1
  let clock = 0

  const newId = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`

  const online = (error: Error) => {
    if (offline) throw error
  }

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
    const category = {
      id: newId(),
      name: input.name,
      kind: input.kind,
      archived,
      emoji: input.emoji ?? 'package',
    }
    categories.push(category)
    return category
  }

  const assertCategoryExists = (categoryId: string) => {
    if (!categories.some((c) => c.id === categoryId)) {
      throw new MovementError('La categoría elegida ya no existe. Elegí otra.')
    }
  }

  const insertMovement = (input: MovementInput): MovementRow => {
    assertCategoryExists(input.categoryId)
    clock += 1
    const row = {
      ...input,
      amount: { ...input.amount },
      id: newId(),
      createdAt: `2026-01-01T00:00:${String(clock).padStart(2, '0')}Z`,
    }
    movements.push(row)
    return row
  }

  const toMovement = (row: MovementRow): Movement => {
    const category = categories.find((c) => c.id === row.categoryId)
    if (!category) throw new Error(`Movement ${row.id} has no category`)
    return {
      id: row.id,
      amount: { ...row.amount },
      occurredOn: row.occurredOn,
      description: row.description,
      createdAt: row.createdAt,
      category: { ...category },
    }
  }

  const saveError = () =>
    new MovementError('No se pudo guardar el movimiento. Revisá tu conexión y probá de nuevo.')

  const movementsApi: MovementsApi = {
    listMovements: async (month: Month) => {
      online(new MovementError('No se pudieron cargar los movimientos.'))
      const { from, to } = monthRange(month)
      return movements.filter((m) => m.occurredOn >= from && m.occurredOn < to).map(toMovement)
    },
    createMovement: async (input) => {
      online(saveError())
      return toMovement(insertMovement(input))
    },
    updateMovement: async (id, input) => {
      online(saveError())
      assertCategoryExists(input.categoryId)
      movements = movements.map((m) =>
        m.id === id ? { ...m, ...input, amount: { ...input.amount } } : m,
      )
      const updated = movements.find((m) => m.id === id)
      if (!updated) throw saveError()
      return toMovement(updated)
    },
    deleteMovement: async (id) => {
      online(new MovementError('No se pudo eliminar el movimiento. Probá de nuevo.'))
      movements = movements.filter((m) => m.id !== id)
    },
  }

  const categoriesApi: CategoriesApi = {
    listCategories: async () => {
      online(new CategoryError('No se pudieron cargar las categorías.'))
      return categories.map((c) => ({ ...c }))
    },
    createCategory: async (input) => {
      online(new CategoryError('No se pudo guardar. Revisá tu conexión y probá de nuevo.'))
      return insertCategory(parse(CategoryInputSchema.safeParse(input)))
    },
    updateCategory: async (category, changes) => {
      online(new CategoryError('No se pudo guardar. Revisá tu conexión y probá de nuevo.'))
      const name = parse(CategoryNameSchema.safeParse(changes.name))
      const emoji = parse(CategoryEmojiSchema.safeParse(changes.emoji))
      assertUnique(name, category.kind, category.id)
      categories = categories.map((c) => (c.id === category.id ? { ...c, name, emoji } : c))
      return { ...category, name, emoji }
    },
    deleteCategory: async (category) => {
      online(new CategoryError('No se pudo eliminar la categoría. Probá de nuevo.'))
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
    },
    restoreCategory: async (category) => {
      online(new CategoryError('No se pudo restaurar la categoría. Probá de nuevo.'))
      categories = categories.map((c) => (c.id === category.id ? { ...c, archived: false } : c))
      return { ...category, archived: false }
    },
    createSuggestedCategories: async (existing) => {
      online(new CategoryError('No se pudieron crear las categorías sugeridas. Probá de nuevo.'))
      missingSuggestedCategories(existing).forEach((input) => insertCategory(input))
    },
  }

  return {
    reset(seed: FakeDataSeed = {}) {
      categories = []
      movements = []
      offline = false
      nextId = 1
      clock = 0
      for (const { archived, ...input } of seed.categories ?? []) insertCategory(input, archived)
      for (const m of seed.movements ?? []) {
        const category = categories.find((c) => c.name === m.category)
        if (!category) throw new Error(`Unknown category in seed: ${m.category}`)
        insertMovement({
          categoryId: category.id,
          amount: { amount: m.amount ?? 1000, currency: m.currency ?? 'ARS' },
          occurredOn: m.occurredOn ?? '2026-10-07',
          description: m.description ?? null,
        })
      }
    },
    /** Without a connection every call fails, until it's set back to false. */
    setOffline(value: boolean) {
      offline = value
    },
    categories: () => categories.map((c) => ({ ...c })),
    movements: () => movements.map(toMovement),
    categoriesApi,
    movementsApi,
  }
}

export type FakeData = ReturnType<typeof createFakeData>
