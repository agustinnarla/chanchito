import { formatDayLabel, monthOf, type IsoDate, type Month } from '../dates'
import type { CryptoPurchase } from '../investments'
import { formatMoney, type Currency } from '../money'
import {
  formatMovementAmount,
  sortMovements,
  type Movement,
  type MovementFilters,
} from '../movements'
import type { Contribution, SavingsGoal } from '../savings'

type EntryGoal = Pick<SavingsGoal, 'id' | 'name' | 'emoji'>

/** A row of the month's list (spec 012): a movement, money put into or out of a goal, or bitcoin. */
export type MonthEntry =
  | { kind: 'movement'; date: IsoDate; movement: Movement }
  | { kind: 'saving'; date: IsoDate; contribution: Contribution; goal: EntryGoal }
  | { kind: 'investment'; date: IsoDate; purchase: CryptoPurchase }

type MonthData = {
  movements: readonly Movement[]
  contributions: readonly Contribution[]
  goals: readonly EntryGoal[]
  purchases: readonly CryptoPurchase[]
}

const ORDER: Record<MonthEntry['kind'], number> = { movement: 0, saving: 1, investment: 2 }

/**
 * Everything of `month`, newest day first. On the same day: movements (last created first),
 * then savings, then investments. Contributions whose goal is gone are left out.
 */
export function monthEntries(
  { movements, contributions, goals, purchases }: MonthData,
  month: Month,
): MonthEntry[] {
  const inMonth = (date: IsoDate) => monthOf(date) === month
  const entries: MonthEntry[] = [
    ...sortMovements(movements.filter((m) => inMonth(m.occurredOn))).map(
      (movement): MonthEntry => ({ kind: 'movement', date: movement.occurredOn, movement }),
    ),
    ...contributions
      .filter((c) => inMonth(c.occurredOn))
      .flatMap((contribution): MonthEntry[] => {
        const goal = goals.find((g) => g.id === contribution.goalId)
        return goal ? [{ kind: 'saving', date: contribution.occurredOn, contribution, goal }] : []
      }),
    ...purchases
      .filter((p) => inMonth(p.occurredOn))
      .map((purchase): MonthEntry => ({ kind: 'investment', date: purchase.occurredOn, purchase })),
  ]
  // Stable: keeps the movements' own order within a day and kind
  return entries.sort((a, b) => b.date.localeCompare(a.date) || ORDER[a.kind] - ORDER[b.kind])
}

function currencyOf(entry: MonthEntry): Currency {
  if (entry.kind === 'movement') return entry.movement.amount.currency
  if (entry.kind === 'saving') return entry.contribution.amount.currency
  return entry.purchase.cost.currency
}

/** The kind filter "set-aside" keeps savings and investments; the others, only movements. */
export function filterEntries(
  entries: readonly MonthEntry[],
  filters: MovementFilters,
): MonthEntry[] {
  return entries.filter((entry) => {
    if (filters.currency !== undefined && currencyOf(entry) !== filters.currency) return false
    if (entry.kind !== 'movement') {
      return filters.categoryId === undefined && (filters.kind ?? 'set-aside') === 'set-aside'
    }
    const { category } = entry.movement
    return (
      (filters.kind === undefined || category.kind === filters.kind) &&
      (filters.categoryId === undefined || category.id === filters.categoryId)
    )
  })
}

export type EntryDay = { date: IsoDate; label: string; entries: MonthEntry[] }

/** Consecutive entries of the same day, in the order given. */
export function groupEntriesByDay(entries: readonly MonthEntry[]): EntryDay[] {
  const days: EntryDay[] = []
  for (const entry of entries) {
    const last = days.at(-1)
    if (last?.date === entry.date) last.entries.push(entry)
    else days.push({ date: entry.date, label: formatDayLabel(entry.date), entries: [entry] })
  }
  return days
}

/** What leaves the month has a minus sign; what comes in or back, a plus sign. */
export function formatEntryAmount(entry: MonthEntry): string {
  if (entry.kind === 'movement') return formatMovementAmount(entry.movement)
  if (entry.kind === 'investment') {
    return formatMoney({ ...entry.purchase.cost, amount: -entry.purchase.cost.amount })
  }
  const { amount } = entry.contribution
  // A contribution leaves the month (minus); a withdrawal comes back (plus)
  return amount.amount > 0
    ? formatMoney({ ...amount, amount: -amount.amount })
    : `+${formatMoney({ ...amount, amount: -amount.amount })}`
}
