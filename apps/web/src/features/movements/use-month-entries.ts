import { monthEntries, type Month, type MonthEntry } from '@chanchito/core'
import { usePurchases } from '@/features/investments/hooks'
import { useContributions, useGoals } from '@/features/savings/hooks'
import { useMovements } from './hooks'

/**
 * The month's list (spec 012): movements, plus money put into or out of goals and bitcoin
 * bought. It waits only for the movements: savings and investments join when they arrive.
 */
export function useMonthEntries(month: Month) {
  const movements = useMovements(month)
  const contributions = useContributions()
  const goals = useGoals()
  const purchases = usePurchases()

  const entries = movements.data
    ? monthEntries(
        {
          movements: movements.data,
          contributions: contributions.data ?? [],
          goals: goals.data ?? [],
          purchases: purchases.data ?? [],
        },
        month,
      )
    : undefined

  return {
    entries,
    isPending: movements.isPending,
    isError: movements.isError,
    refetch: movements.refetch,
  }
}

/** A stable key for any entry of the month. */
export function entryKey(entry: MonthEntry): string {
  if (entry.kind === 'movement') return `m-${entry.movement.id}`
  return entry.kind === 'saving' ? `s-${entry.contribution.id}` : `i-${entry.purchase.id}`
}
