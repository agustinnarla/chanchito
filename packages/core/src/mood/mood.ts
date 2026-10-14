import type { CurrencySummary } from '../balance'
import type { BudgetProgress, WeeklyBudgetProgress } from '../budgets'
import { formatMonthName, monthOf, type IsoDate, type Month } from '../dates'
import { formatWholeMoney, type Currency, type Money } from '../money'

/** How the month is going in one currency, for the mascot and the month's panel (spec 008). */
export type MonthMood =
  | { kind: 'empty' }
  | { kind: 'quiet'; currency: Currency }
  | { kind: 'good'; net: Money; saved: Money; invested: Money }
  | { kind: 'warning'; period: 'month' | 'week'; budget: AnyProgress }
  | { kind: 'exceeded'; period: 'month' | 'week'; budget: AnyProgress }
  | { kind: 'negative'; net: Money }

type AnyProgress = BudgetProgress | WeeklyBudgetProgress

type MoodInput = {
  /** Whether the month has movements in any currency. */
  hasMovements: boolean
  /** The chosen currency's summary. */
  summary: CurrencySummary
  /** The chosen currency's budgets. */
  budgets: readonly BudgetProgress[]
  /** The chosen currency's weekly budgets for this week (spec 013), when it's the current month. */
  weeklyBudgets?: readonly WeeklyBudgetProgress[]
  /** What was put into savings goals this month, minus withdrawals (spec 009). Not an expense. */
  saved?: Money
  /** What went into investments this month (spec 010). Not an expense either. */
  invested?: Money
}

/** The first rule that applies: empty, quiet, exceeded, negative, warning, good. */
export function monthMood({
  hasMovements,
  summary,
  budgets,
  weeklyBudgets = [],
  saved,
  invested,
}: MoodInput): MonthMood {
  if (!hasMovements) return { kind: 'empty' }
  if (summary.income.amount === 0 && summary.expense.amount === 0) {
    return { kind: 'quiet', currency: summary.net.currency }
  }
  const exceeded = worst(budgets, weeklyBudgets, 'exceeded')
  if (exceeded) return { kind: 'exceeded', ...exceeded }
  if (summary.net.amount < 0) return { kind: 'negative', net: summary.net }
  const warning = worst(budgets, weeklyBudgets, 'warning')
  if (warning) return { kind: 'warning', ...warning }
  const zero = { amount: 0, currency: summary.net.currency }
  return { kind: 'good', net: summary.net, saved: saved ?? zero, invested: invested ?? zero }
}

/**
 * The budget in `status` with the highest ratio, monthly or weekly. On a tie, the monthly one
 * and then the first by name (they come sorted).
 */
function worst(
  monthly: readonly BudgetProgress[],
  weekly: readonly WeeklyBudgetProgress[],
  status: 'warning' | 'exceeded',
): { period: 'month' | 'week'; budget: AnyProgress } | undefined {
  const candidates = [
    ...monthly.map((budget) => ({ period: 'month' as const, budget })),
    ...weekly.map((budget) => ({ period: 'week' as const, budget })),
  ].filter((c) => c.budget.status === status)
  return candidates.reduce<(typeof candidates)[number] | undefined>(
    (best, c) => (best === undefined || c.budget.ratio > best.budget.ratio ? c : best),
    undefined,
  )
}

const CURRENCY_NAME: Record<Currency, string> = { ARS: 'pesos', USD: 'dólares' }
const MAX_NAME_LENGTH = 24

function shortName(name: string): string {
  const characters = [...name]
  if (characters.length <= MAX_NAME_LENGTH) return name
  return `${characters.slice(0, MAX_NAME_LENGTH).join('').trimEnd()}…`
}

/** Whether `today` is in `month` and before its last day: only then is there "month left". */
function monthLeft(month: Month, today: IsoDate): boolean {
  const [year, monthNumber, day] = today.split('-').map(Number) as [number, number, number]
  const isLastDay = new Date(Date.UTC(year, monthNumber - 1, day + 1)).getUTCDate() === 1
  return monthOf(today) === month && !isLastDay
}

/** The mascot's sentence for a mood, in Spanish (Argentina). It reassures, it doesn't scold. */
export function moodMessage(mood: MonthMood, { month, today }: { month: Month; today: IsoDate }) {
  switch (mood.kind) {
    case 'empty':
      return `Arranquemos ${formatMonthName(month)}: todavía no cargaste nada.`
    case 'quiet':
      return `Este mes no hay movimientos en ${CURRENCY_NAME[mood.currency]}.`
    case 'good':
      return goodMessage(mood)
    case 'negative':
      return 'Este mes salió más de lo que entró.'
    case 'warning': {
      const when = mood.period === 'week' ? ' esta semana' : ''
      return `Ojo: ${shortName(mood.budget.budget.category.name)} ya va por el ${Math.round(mood.budget.ratio * 100)}%${when}.`
    }
    case 'exceeded': {
      const name = shortName(mood.budget.budget.category.name)
      if (mood.period === 'week') {
        return `Te pasaste en ${name} esta semana. Tranqui, el lunes arranca una nueva.`
      }
      const sentence = `Te pasaste en ${name}.`
      return monthLeft(month, today)
        ? `${sentence} Tranqui, todavía queda mes para acomodarlo.`
        : sentence
    }
  }
}

/**
 * "Te sobran" is what's left after saving and investing: the result minus what went into goals
 * and investments. "e invertiste": "y" becomes "e" before an "i" sound.
 */
function goodMessage({ net, saved, invested }: Extract<MonthMood, { kind: 'good' }>): string {
  const parts = [
    saved.amount > 0 ? `ahorraste ${formatWholeMoney(saved)}` : null,
    invested.amount > 0 ? `invertiste ${formatWholeMoney(invested)}` : null,
  ].filter((part) => part !== null)

  if (parts.length > 0) {
    const did = parts.join(' e ')
    const left = { amount: net.amount - saved.amount - invested.amount, currency: net.currency }
    if (left.amount <= 0) return `¡Vas bárbaro! Este mes ${did}.`
    const comma = parts.length > 1 ? ',' : ''
    return `¡Vas bárbaro! ${did[0]?.toUpperCase()}${did.slice(1)}${comma} y te sobran ${formatWholeMoney(left)}.`
  }
  return net.amount === 0
    ? 'Este mes quedaste justo.'
    : `¡Vas bárbaro! Este mes te sobran ${formatWholeMoney(net)}.`
}

export type DayPart = 'morning' | 'afternoon' | 'night'

/** From 5 to 11:59, morning; from 12 to 19:59, afternoon; the rest, night. In local time. */
export function dayPart(date: Date): DayPart {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 20) return 'afternoon'
  return 'night'
}

const GREETINGS: Record<DayPart, string> = {
  morning: 'Buen día',
  afternoon: 'Buenas tardes',
  night: 'Buenas noches',
}

export function greeting(part: DayPart): string {
  return GREETINGS[part]
}
