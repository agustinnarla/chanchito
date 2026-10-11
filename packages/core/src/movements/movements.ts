import { formatMoney } from '../money'
import type { Movement, MovementFilters } from './types'

/** Expenses with a minus sign and income with a plus sign: "-$ 1.234,56", "+US$ 100,00". */
export function formatMovementAmount(movement: Movement): string {
  if (movement.category.kind === 'expense') {
    return formatMoney({ ...movement.amount, amount: -movement.amount.amount })
  }
  return `+${formatMoney(movement.amount)}`
}

/** Newest date first; on the same date, the last created first. */
export function sortMovements(movements: readonly Movement[]): Movement[] {
  return [...movements].sort(
    (a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.localeCompare(a.createdAt),
  )
}

export function filterMovements(
  movements: readonly Movement[],
  filters: MovementFilters,
): Movement[] {
  return movements.filter(
    (m) =>
      (filters.kind === undefined || m.category.kind === filters.kind) &&
      (filters.categoryId === undefined || m.category.id === filters.categoryId) &&
      (filters.currency === undefined || m.amount.currency === filters.currency),
  )
}
