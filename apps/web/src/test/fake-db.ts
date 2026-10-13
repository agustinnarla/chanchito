import {
  categoryNameKey,
  CategoryEmojiSchema,
  CategoryInputSchema,
  CategoryNameSchema,
  missingSuggestedCategories,
  monthRange,
  type Budget,
  type BudgetInput,
  type Contribution,
  type CryptoPurchase,
  type CryptoPurchaseInput,
  type ContributionInput,
  type SavingsGoal,
  type SavingsGoalInput,
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
import { InvestmentError } from '@/features/investments/errors'
import { MovementError } from '@/features/movements/errors'
import { SavingsError } from '@/features/savings/errors'

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

export type FakeGoalSeed = Partial<SavingsGoalInput> & { name: string; archived?: boolean }

export type FakeContributionSeed = {
  /** Name of a seeded goal. */
  goal: string
  amount: number
  occurredOn?: string
}

export type FakePurchaseSeed = Partial<Omit<CryptoPurchaseInput, 'cost'>> & {
  quantity: number
  /** Pesos paid, in cents. */
  cost: number
}

export type FakeSeed = {
  categories?: (CategoryInput & { archived?: boolean })[]
  movements?: FakeMovementSeed[]
  budgets?: FakeBudgetSeed[]
  goals?: FakeGoalSeed[]
  contributions?: FakeContributionSeed[]
  purchases?: FakePurchaseSeed[]
}

/**
 * In-memory stand-in for the data layer (`features/*\/api.ts`) with the same rules as the
 * database: normalized and unique names, movements need an existing category, categories
 * with movements can't be deleted, budgets need an expense category and are unique per
 * category, month and currency, and deleting a category deletes its budgets. Savings goals have
 * unique names and contributions go in their goal's saving currency, never zero. Bitcoin purchases
 * need a positive quantity and cost.
 * One shared instance per test file, so the mocked APIs see the same data.
 */
function createFakeDb() {
  let categories: Category[] = []
  let movements: MovementRow[] = []
  let budgets: BudgetRow[] = []
  let goals: SavingsGoal[] = []
  let contributions: Contribution[] = []
  let purchases: CryptoPurchase[] = []
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
      category: {
        id: category.id,
        name: category.name,
        archived: category.archived,
        emoji: category.emoji,
      },
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

  const goalKey = (name: string) => name.toLowerCase()

  const assertGoalNameFree = (name: string, exceptId?: string) => {
    if (goals.some((g) => g.id !== exceptId && goalKey(g.name) === goalKey(name))) {
      throw new SavingsError('Ya tenés una meta con ese nombre.', 'duplicate')
    }
  }

  const insertGoal = (input: SavingsGoalInput, archived = false): SavingsGoal => {
    assertGoalNameFree(input.name)
    const goal = { ...input, target: { ...input.target }, id: newId(), archived }
    goals.push(goal)
    return goal
  }

  const insertContribution = (input: ContributionInput): Contribution => {
    const goal = goals.find((g) => g.id === input.goalId)
    if (!goal || goal.savingCurrency !== input.amount.currency) {
      throw new SavingsError('La meta ya no existe. Recargá la página.', 'goal')
    }
    if (input.amount.amount === 0) {
      throw new SavingsError('El monto no es válido. Revisalo y probá de nuevo.')
    }
    const contribution = { ...input, amount: { ...input.amount }, id: newId() }
    contributions.push(contribution)
    return contribution
  }

  const copyGoal = (g: SavingsGoal) => ({ ...g, target: { ...g.target } })
  const copyContribution = (c: Contribution) => ({ ...c, amount: { ...c.amount } })

  const savingsApi = {
    listGoals: vi.fn(async () => goals.map(copyGoal)),
    createGoal: vi.fn(async (input: SavingsGoalInput) => copyGoal(insertGoal(input))),
    updateGoal: vi.fn(
      async (id: string, changes: Pick<SavingsGoalInput, 'name' | 'emoji' | 'target'>) => {
        assertGoalNameFree(changes.name, id)
        goals = goals.map((g) => (g.id === id ? { ...g, ...changes } : g))
        const updated = goals.find((g) => g.id === id)
        if (!updated) throw new SavingsError('No se pudo guardar la meta.')
        return copyGoal(updated)
      },
    ),
    setGoalArchived: vi.fn(async (id: string, archived: boolean) => {
      goals = goals.map((g) => (g.id === id ? { ...g, archived } : g))
      const updated = goals.find((g) => g.id === id)
      if (!updated) throw new SavingsError('No se pudo archivar la meta. Probá de nuevo.')
      return copyGoal(updated)
    }),
    deleteGoal: vi.fn(async (id: string) => {
      goals = goals.filter((g) => g.id !== id)
      contributions = contributions.filter((c) => c.goalId !== id)
    }),
    listContributions: vi.fn(async () =>
      [...contributions]
        .reverse()
        .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))
        .map(copyContribution),
    ),
    createContribution: vi.fn(async (input: ContributionInput) =>
      copyContribution(insertContribution(input)),
    ),
    updateContribution: vi.fn(
      async (id: string, changes: { amount: Contribution['amount']; occurredOn: string }) => {
        contributions = contributions.map((c) => (c.id === id ? { ...c, ...changes } : c))
        const updated = contributions.find((c) => c.id === id)
        if (!updated) throw new SavingsError('No se pudo guardar el aporte.')
        return copyContribution(updated)
      },
    ),
    deleteContribution: vi.fn(async (id: string) => {
      contributions = contributions.filter((c) => c.id !== id)
    }),
  }

  const insertPurchase = (input: CryptoPurchaseInput): CryptoPurchase => {
    if (input.quantity <= 0 || input.cost.amount <= 0) {
      throw new InvestmentError('Algún dato de la compra no es válido. Revisalo y probá de nuevo.')
    }
    const purchase = { ...input, cost: { ...input.cost }, id: newId() }
    purchases.push(purchase)
    return purchase
  }

  const copyPurchase = (p: CryptoPurchase) => ({ ...p, cost: { ...p.cost } })

  const investmentsApi = {
    listPurchases: vi.fn(async () =>
      [...purchases]
        .reverse()
        .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))
        .map(copyPurchase),
    ),
    createPurchase: vi.fn(async (input: CryptoPurchaseInput) =>
      copyPurchase(insertPurchase(input)),
    ),
    updatePurchase: vi.fn(async (id: string, input: CryptoPurchaseInput) => {
      // Like the database: the currency it was paid in can't change
      purchases = purchases.map((p) =>
        p.id === id
          ? { ...p, ...input, cost: { amount: input.cost.amount, currency: p.cost.currency } }
          : p,
      )
      const updated = purchases.find((p) => p.id === id)
      if (!updated) throw new InvestmentError('No se pudo guardar la compra.')
      return copyPurchase(updated)
    }),
    deletePurchase: vi.fn(async (id: string) => {
      purchases = purchases.filter((p) => p.id !== id)
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
    updateCategory: vi.fn(async (category: Category, changes: { name: string; emoji: string }) => {
      const name = parse(CategoryNameSchema.safeParse(changes.name))
      const emoji = parse(CategoryEmojiSchema.safeParse(changes.emoji))
      assertUnique(name, category.kind, category.id)
      categories = categories.map((c) => (c.id === category.id ? { ...c, name, emoji } : c))
      return { ...category, name, emoji }
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
      goals = []
      contributions = []
      purchases = []
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
      for (const { archived, ...g } of seed.goals ?? []) {
        insertGoal(
          {
            name: g.name,
            emoji: g.emoji ?? 'package',
            target: g.target ?? { amount: 80000, currency: 'USD' },
            savingCurrency: g.savingCurrency ?? 'ARS',
          },
          archived,
        )
      }
      for (const c of seed.contributions ?? []) {
        const goal = goals.find((g) => g.name === c.goal)
        if (!goal) throw new Error(`Unknown goal in seed: ${c.goal}`)
        insertContribution({
          goalId: goal.id,
          amount: { amount: c.amount, currency: goal.savingCurrency },
          occurredOn: c.occurredOn ?? '2026-10-07',
        })
      }
      for (const p of seed.purchases ?? []) {
        insertPurchase({
          quantity: p.quantity,
          cost: { amount: p.cost, currency: 'ARS' },
          platform: p.platform ?? 'Binance',
          occurredOn: p.occurredOn ?? '2026-10-07',
        })
      }
      vi.clearAllMocks()
    },
    categories: () => categories.map((c) => ({ ...c })),
    movements: () => movements.map(toMovement),
    budgets: () => budgets.map(toBudget),
    goals: () => goals.map(copyGoal),
    contributions: () => contributions.map(copyContribution),
    purchases: () => purchases.map(copyPurchase),
    categoriesApi,
    movementsApi,
    budgetsApi,
    savingsApi,
    investmentsApi,
  }
}

export const fakeDb = createFakeDb()
