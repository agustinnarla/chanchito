import type {
  Budget,
  BudgetInput,
  Currency,
  Money,
  Month,
  WeeklyBudget,
  WeeklyBudgetInput,
} from '@chanchito/core'
import { supabase } from '@/lib/supabase'
import {
  BudgetError,
  toBudgetCopyError,
  toBudgetSaveError,
  toWeeklyBudgetSaveError,
} from './errors'

const COLUMNS = 'id, month, amount, currency, category:categories(id, name, archived_at, emoji)'

type BudgetRow = {
  id: string
  month: string
  amount: number
  currency: Currency
  category: { id: string; name: string; archived_at: string | null; emoji: string }
}

/** The month is stored as its first day: '2026-10-01' ↔ '2026-10'. */
const toDate = (month: Month) => `${month}-01`

const toBudget = (row: BudgetRow): Budget => ({
  id: row.id,
  month: row.month.slice(0, 7),
  amount: { amount: row.amount, currency: row.currency },
  category: {
    id: row.category.id,
    name: row.category.name,
    archived: row.category.archived_at !== null,
    emoji: row.category.emoji,
  },
})

const toRow = (input: BudgetInput) => ({
  category_id: input.categoryId,
  month: toDate(input.month),
  amount: input.amount.amount,
  currency: input.amount.currency,
})

/** Budgets of one month (unsorted). */
export async function listBudgets(month: Month): Promise<Budget[]> {
  const { data, error } = await supabase.from('budgets').select(COLUMNS).eq('month', toDate(month))
  if (error) {
    throw new BudgetError('No se pudieron cargar los presupuestos.')
  }
  return data.map(toBudget)
}

/** Creates a budget. The input comes from `parseBudgetForm`, already validated. */
export async function createBudget(input: BudgetInput): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .insert(toRow(input))
    .select(COLUMNS)
    .single()
  if (error) throw toBudgetSaveError(error)
  return toBudget(data)
}

/** Only the amount can change; the currency stays the budget's own. */
export async function updateBudgetAmount(id: string, amount: Money): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .update({ amount: amount.amount })
    .eq('id', id)
    .select(COLUMNS)
    .single()
  if (error) throw toBudgetSaveError(error)
  return toBudget(data)
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id)
  if (error) {
    throw new BudgetError('No se pudo eliminar el presupuesto. Probá de nuevo.')
  }
}

/** Creates all the budgets at once (all or none). Returns how many were created. */
export async function copyBudgets(inputs: BudgetInput[]): Promise<number> {
  if (inputs.length === 0) return 0
  const { data, error } = await supabase.from('budgets').insert(inputs.map(toRow)).select('id')
  if (error) throw toBudgetCopyError(error)
  return data.length
}

// Weekly budgets (spec 013) --------------------------------------------------------------------

const WEEKLY_COLUMNS = 'id, amount, currency, category:categories(id, name, archived_at, emoji)'

type WeeklyBudgetRow = Omit<BudgetRow, 'month'>

const toWeeklyBudget = (row: WeeklyBudgetRow): WeeklyBudget => ({
  id: row.id,
  amount: { amount: row.amount, currency: row.currency },
  category: {
    id: row.category.id,
    name: row.category.name,
    archived: row.category.archived_at !== null,
    emoji: row.category.emoji,
  },
})

/** Every weekly budget: they repeat every week, so there's no date to filter by. */
export async function listWeeklyBudgets(): Promise<WeeklyBudget[]> {
  const { data, error } = await supabase.from('weekly_budgets').select(WEEKLY_COLUMNS)
  if (error) throw new BudgetError('No se pudieron cargar los presupuestos semanales.')
  return data.map(toWeeklyBudget)
}

export async function createWeeklyBudget(input: WeeklyBudgetInput): Promise<WeeklyBudget> {
  const { data, error } = await supabase
    .from('weekly_budgets')
    .insert({
      category_id: input.categoryId,
      amount: input.amount.amount,
      currency: input.amount.currency,
    })
    .select(WEEKLY_COLUMNS)
    .single()
  if (error) throw toWeeklyBudgetSaveError(error)
  return toWeeklyBudget(data)
}

/** Only the amount can change, for every week. */
export async function updateWeeklyBudgetAmount(id: string, amount: Money): Promise<WeeklyBudget> {
  const { data, error } = await supabase
    .from('weekly_budgets')
    .update({ amount: amount.amount })
    .eq('id', id)
    .select(WEEKLY_COLUMNS)
    .single()
  if (error) throw toWeeklyBudgetSaveError(error)
  return toWeeklyBudget(data)
}

export async function deleteWeeklyBudget(id: string): Promise<void> {
  const { error } = await supabase.from('weekly_budgets').delete().eq('id', id)
  if (error) throw new BudgetError('No se pudo eliminar el presupuesto. Probá de nuevo.')
}
