import type {
  Contribution,
  ContributionInput,
  Currency,
  Money,
  SavingsGoal,
  SavingsGoalInput,
} from '@chanchito/core'
import { supabase } from '@/lib/supabase'
import { SavingsError, toContributionSaveError, toGoalSaveError } from './errors'

const GOAL_COLUMNS = 'id, name, emoji, target_amount, target_currency, saving_currency, archived'
const CONTRIBUTION_COLUMNS = 'id, goal_id, amount, currency, occurred_on'

type GoalRow = {
  id: string
  name: string
  emoji: string
  target_amount: number
  target_currency: Currency
  saving_currency: Currency
  archived: boolean
}

type ContributionRow = {
  id: string
  goal_id: string
  amount: number
  currency: Currency
  occurred_on: string
}

const toGoal = (row: GoalRow): SavingsGoal => ({
  id: row.id,
  name: row.name,
  emoji: row.emoji,
  target: { amount: row.target_amount, currency: row.target_currency },
  savingCurrency: row.saving_currency,
  archived: row.archived,
})

const toContribution = (row: ContributionRow): Contribution => ({
  id: row.id,
  goalId: row.goal_id,
  amount: { amount: row.amount, currency: row.currency },
  occurredOn: row.occurred_on,
})

/** Every goal, archived ones too, oldest first. */
export async function listGoals(): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from('savings_goals')
    .select(GOAL_COLUMNS)
    .order('created_at')
  if (error) throw new SavingsError('No se pudieron cargar las metas.')
  return data.map(toGoal)
}

/** Creates a goal. The input comes from `parseGoalForm`, already validated. */
export async function createGoal(input: SavingsGoalInput): Promise<SavingsGoal> {
  const { data, error } = await supabase
    .from('savings_goals')
    .insert({
      name: input.name,
      emoji: input.emoji,
      target_amount: input.target.amount,
      target_currency: input.target.currency,
      saving_currency: input.savingCurrency,
    })
    .select(GOAL_COLUMNS)
    .single()
  if (error) throw toGoalSaveError(error)
  return toGoal(data)
}

/** Name, emoji and target can change; the saving currency can't. */
export async function updateGoal(
  id: string,
  changes: Pick<SavingsGoalInput, 'name' | 'emoji' | 'target'>,
): Promise<SavingsGoal> {
  const { data, error } = await supabase
    .from('savings_goals')
    .update({
      name: changes.name,
      emoji: changes.emoji,
      target_amount: changes.target.amount,
      target_currency: changes.target.currency,
    })
    .eq('id', id)
    .select(GOAL_COLUMNS)
    .single()
  if (error) throw toGoalSaveError(error)
  return toGoal(data)
}

export async function setGoalArchived(id: string, archived: boolean): Promise<SavingsGoal> {
  const { data, error } = await supabase
    .from('savings_goals')
    .update({ archived })
    .eq('id', id)
    .select(GOAL_COLUMNS)
    .single()
  if (error) throw new SavingsError('No se pudo archivar la meta. Probá de nuevo.')
  return toGoal(data)
}

/** Deletes the goal and, with it, its contributions. */
export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id)
  if (error) throw new SavingsError('No se pudo eliminar la meta. Probá de nuevo.')
}

/** Every contribution and withdrawal, newest first. */
export async function listContributions(): Promise<Contribution[]> {
  const { data, error } = await supabase
    .from('savings_contributions')
    .select(CONTRIBUTION_COLUMNS)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw new SavingsError('No se pudieron cargar los aportes.')
  return data.map(toContribution)
}

/** Stores a contribution (positive) or a withdrawal (negative) from `parseContributionForm`. */
export async function createContribution(input: ContributionInput): Promise<Contribution> {
  const { data, error } = await supabase
    .from('savings_contributions')
    .insert({
      goal_id: input.goalId,
      amount: input.amount.amount,
      currency: input.amount.currency,
      occurred_on: input.occurredOn,
    })
    .select(CONTRIBUTION_COLUMNS)
    .single()
  if (error) throw toContributionSaveError(error)
  return toContribution(data)
}

/** Amount and date can change; the goal and currency can't. */
export async function updateContribution(
  id: string,
  changes: { amount: Money; occurredOn: string },
): Promise<Contribution> {
  const { data, error } = await supabase
    .from('savings_contributions')
    .update({ amount: changes.amount.amount, occurred_on: changes.occurredOn })
    .eq('id', id)
    .select(CONTRIBUTION_COLUMNS)
    .single()
  if (error) throw toContributionSaveError(error)
  return toContribution(data)
}

export async function deleteContribution(id: string): Promise<void> {
  const { error } = await supabase.from('savings_contributions').delete().eq('id', id)
  if (error) throw new SavingsError('No se pudo eliminar el aporte. Probá de nuevo.')
}
