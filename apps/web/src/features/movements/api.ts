import { monthRange, type Month, type Movement, type MovementInput } from '@chanchito/core'
import { supabase } from '@/lib/supabase'
import { MovementError, toMovementSaveError } from './errors'

const COLUMNS =
  'id, amount, currency, occurred_on, description, created_at, category:categories(id, name, kind, archived_at)'

type MovementRow = {
  id: string
  amount: number
  currency: Movement['amount']['currency']
  occurred_on: string
  description: string | null
  created_at: string
  category: {
    id: string
    name: string
    kind: Movement['category']['kind']
    archived_at: string | null
  }
}

const toMovement = (row: MovementRow): Movement => ({
  id: row.id,
  amount: { amount: row.amount, currency: row.currency },
  occurredOn: row.occurred_on,
  description: row.description,
  createdAt: row.created_at,
  category: {
    id: row.category.id,
    name: row.category.name,
    kind: row.category.kind,
    archived: row.category.archived_at !== null,
  },
})

const toRow = (input: MovementInput) => ({
  category_id: input.categoryId,
  amount: input.amount.amount,
  currency: input.amount.currency,
  occurred_on: input.occurredOn,
  description: input.description,
})

/** Movements of one month (unsorted). */
export async function listMovements(month: Month): Promise<Movement[]> {
  const { from, to } = monthRange(month)
  const { data, error } = await supabase
    .from('movements')
    .select(COLUMNS)
    .gte('occurred_on', from)
    .lt('occurred_on', to)
  if (error) {
    throw new MovementError('No se pudieron cargar los movimientos.')
  }
  return data.map(toMovement)
}

/** Creates a movement. The input comes from `parseMovementForm`, already validated. */
export async function createMovement(input: MovementInput): Promise<Movement> {
  const { data, error } = await supabase
    .from('movements')
    .insert(toRow(input))
    .select(COLUMNS)
    .single()
  if (error) throw toMovementSaveError(error)
  return toMovement(data)
}

export async function updateMovement(id: string, input: MovementInput): Promise<Movement> {
  const { data, error } = await supabase
    .from('movements')
    .update(toRow(input))
    .eq('id', id)
    .select(COLUMNS)
    .single()
  if (error) throw toMovementSaveError(error)
  return toMovement(data)
}

export async function deleteMovement(id: string): Promise<void> {
  const { error } = await supabase.from('movements').delete().eq('id', id)
  if (error) {
    throw new MovementError('No se pudo eliminar el movimiento. Probá de nuevo.')
  }
}
