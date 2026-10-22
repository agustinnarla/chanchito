import { monthRange, type Month, type Movement, type MovementInput } from '@chanchito/core'
import type { Client } from '../client'
import { MovementError, toMovementSaveError } from './errors'

const COLUMNS =
  'id, amount, currency, occurred_on, description, created_at, category:categories(id, name, kind, archived_at, emoji)'

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
    emoji: string
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
    emoji: row.category.emoji,
  },
})

const toRow = (input: MovementInput) => ({
  category_id: input.categoryId,
  amount: input.amount.amount,
  currency: input.amount.currency,
  occurred_on: input.occurredOn,
  description: input.description,
})

export type MovementsApi = ReturnType<typeof createMovementsApi>

/** The movements data layer, on the given Supabase client. */
export function createMovementsApi(supabase: Client) {
  /** Movements of one month (unsorted). */
  async function listMovements(month: Month): Promise<Movement[]> {
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
  async function createMovement(input: MovementInput): Promise<Movement> {
    const { data, error } = await supabase
      .from('movements')
      .insert(toRow(input))
      .select(COLUMNS)
      .single()
    if (error) throw toMovementSaveError(error)
    return toMovement(data)
  }

  async function updateMovement(id: string, input: MovementInput): Promise<Movement> {
    const { data, error } = await supabase
      .from('movements')
      .update(toRow(input))
      .eq('id', id)
      .select(COLUMNS)
      .single()
    if (error) throw toMovementSaveError(error)
    return toMovement(data)
  }

  async function deleteMovement(id: string): Promise<void> {
    const { error } = await supabase.from('movements').delete().eq('id', id)
    if (error) {
      throw new MovementError('No se pudo eliminar el movimiento. Probá de nuevo.')
    }
  }

  return { listMovements, createMovement, updateMovement, deleteMovement }
}
