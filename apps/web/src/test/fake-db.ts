import {
  categoryNameKey,
  CategoryInputSchema,
  CategoryNameSchema,
  missingSuggestedCategories,
  monthRange,
  type Budget,
  type BudgetInput,
  type Category,
  type CategoryInput,
  type CategoryKind,
  type Currency,
  type Month,
  type Movement,
  type MovementInput,
} from '@chanchito/core'
import { vi } from 'vitest'
import { BudgetError } from '@/features/budgets/errors'
import { CategoryError, duplicateNameError } from '@/features/categories/errors'
import { MovementError } from '@/features/movements/errors'

type MovementRow = MovementInput & { id: string; createdAt: string }
type BudgetRow = BudgetInput & { id: string }

export type FakeMovementSeed = {
  /** Name of a seeded category. */
  category: string
  amount?: number
  currency?: Currency
  occurredOn?: string
  description?: string | null
}

export type FakeBudgetSeed = {
  /** Name of a seeded expense category. */
  category: string
  amount?: number
  currency?: Currency
  month?: Month
}

export type FakeSeed = {
  categories?: (CategoryInput & { archived?: boolean })[]
  movements?: FakeMovementSeed[]
  budgets?: FakeBudgetSeed[]
}

/**
 * In-memory stand-in for the data layer (`features/*\/api.ts`) with the same rules as the
 * database: normalized and unique names, movements need an existing category, categories
 * with movements can't be deleted, budgets need an expense category and are unique per
 * category, month and currency, and deleting a category deletes its budgets.
 * One shared instance per test file, so the mocked APIs see the same data.
 */
function createFakeDb() {
  let categories: Category[] = []
  let movements: MovementRow[] = []
  let budgets: BudgetRow[] = []
  let nextId = 1
  let clock = 0

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

  const insertMovement = (input: MovementInput): MovementRow => {
    if (!categories.some((c) => c.id === input.categoryId)) {
      throw new MovementError('La categoría elegida ya no existe. Elegí otra.')
    }
    clock += 1
    const row = {
      ...input,
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

  const assertBudgetCanBeAdded = (input: BudgetInput, pending: BudgetInput[] = []) => {
    const category = categories.find((c) => c.id === input.categoryId)
    if (!category || category.kind !== 'expense') {
      throw new BudgetError('La categoría elegida ya no existe. Elegí otra.', 'category')
    }
    const sameKey = (b: BudgetInput) =>
      b.categoryId === input.categoryId &&
      b.month === input.month &&
      b.amount.currency === input.amount.currency
    if (budgets.some(sameKey) || pending.some(sameKey)) {
      throw new BudgetError(
        'Ya hay un presupuesto para esa categoría y moneda en este mes.',
        'duplicate',
      )
    }
  }

  const insertBudget = (input: BudgetInput): BudgetRow => {
    assertBudgetCanBeAdded(input)
    const row = { ...input, amount: { ...input.amount }, id: newId() }
    budgets.push(row)
    return row
  }

  const toBudget = (row: BudgetRow): Budget => {
    const category = categories.find((c) => c.id === row.categoryId)
    if (!category) throw new Error(`Budget ${row.id} has no category`)
    return {
      id: row.id,
      month: row.month,
      amount: { ...row.amount },
      category: { id: category.id, name: category.name, archived: category.archived },
    }
  }

  const budgetsApi = {
    listBudgets: vi.fn(async (month: Month) =>
      budgets.filter((b) => b.month === month).map(toBudget),
    ),
    createBudget: vi.fn(async (input: BudgetInput) => toBudget(insertBudget(input))),
    updateBudgetAmount: vi.fn(async (id: string, amount: Budget['amount']) => {
      budgets = budgets.map((b) => (b.id === id ? { ...b, amount: { ...amount } } : b))
      const updated = budgets.find((b) => b.id === id)
      if (!updated) throw new BudgetError('No se pudo guardar el presupuesto.')
      return toBudget(updated)
    }),
    deleteBudget: vi.fn(async (id: string) => {
      budgets = budgets.filter((b) => b.id !== id)
    }),
    copyBudgets: vi.fn(async (inputs: BudgetInput[]) => {
      // All or none, like a single insert.
      inputs.forEach((input, i) => {
        try {
          assertBudgetCanBeAdded(input, inputs.slice(0, i))
        } catch (error) {
          if (error instanceof BudgetError && error.reason === 'duplicate') {
            throw new BudgetError('Este mes ya tiene presupuestos. Recargá la página.', 'duplicate')
          }
          throw error
        }
      })
      inputs.forEach(insertBudget)
      return inputs.length
    }),
  }

  const movementsApi = {
    listMovements: vi.fn(async (month: Month) => {
      const { from, to } = monthRange(month)
      return movements.filter((m) => m.occurredOn >= from && m.occurredOn < to).map(toMovement)
    }),
    createMovement: vi.fn(async (input: MovementInput) => toMovement(insertMovement(input))),
    updateMovement: vi.fn(async (id: string, input: MovementInput) => {
      if (!categories.some((c) => c.id === input.categoryId)) {
        throw new MovementError('La categoría elegida ya no existe. Elegí otra.')
      }
      movements = movements.map((m) => (m.id === id ? { ...m, ...input } : m))
      const updated = movements.find((m) => m.id === id)
      if (!updated) throw new MovementError('No se pudo guardar el movimiento.')
      return toMovement(updated)
    }),
    deleteMovement: vi.fn(async (id: string) => {
      movements = movements.filter((m) => m.id !== id)
    }),
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
        budgets = budgets.filter((b) => b.categoryId !== category.id)
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
      budgets = []
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
      for (const b of seed.budgets ?? []) {
        const category = categories.find((c) => c.name === b.category && c.kind === 'expense')
        if (!category) throw new Error(`Unknown expense category in seed: ${b.category}`)
        insertBudget({
          categoryId: category.id,
          month: b.month ?? '2026-10',
          amount: { amount: b.amount ?? 1000, currency: b.currency ?? 'ARS' },
        })
      }
      vi.clearAllMocks()
    },
    categories: () => categories.map((c) => ({ ...c })),
    movements: () => movements.map(toMovement),
    budgets: () => budgets.map(toBudget),
    categoriesApi,
    movementsApi,
    budgetsApi,
  }
}

export const fakeDb = createFakeDb()
