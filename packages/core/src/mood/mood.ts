import type { CurrencySummary } from '../balance'
import type { BudgetProgress } from '../budgets'
import { formatMonthName, monthOf, type IsoDate, type Month } from '../dates'
import { formatWholeMoney, type Currency, type Money } from '../money'

/** How the month is going in one currency, for the mascot and the month's panel (spec 008). */
export type MonthMood =
  | { kind: 'empty' }
  | { kind: 'quiet'; currency: Currency }
  | { kind: 'good'; net: Money; saved: Money }
  | { kind: 'warning'; budget: BudgetProgress }
  | { kind: 'exceeded'; budget: BudgetProgress }
  | { kind: 'negative'; net: Money }

type MoodInput = {
  /** Whether the month has movements in any currency. */
  hasMovements: boolean
  /** The chosen currency's summary. */
  summary: CurrencySummary
  /** The chosen currency's budgets. */
  budgets: readonly BudgetProgress[]
  /** What was put into savings goals this month, minus withdrawals (spec 009). Not an expense. */
  saved?: Money
}

/** The first rule that applies: empty, quiet, exceeded, negative, warning, good. */
export function monthMood({ hasMovements, summary, budgets, saved }: MoodInput): MonthMood {
  if (!hasMovements) return { kind: 'empty' }
  if (summary.income.amount === 0 && summary.expense.amount === 0) {
    return { kind: 'quiet', currency: summary.net.currency }
  }
  const exceeded = highestRatio(budgets.filter((b) => b.status === 'exceeded'))
  if (exceeded) return { kind: 'exceeded', budget: exceeded }
  if (summary.net.amount < 0) return { kind: 'negative', net: summary.net }
  const warning = highestRatio(budgets.filter((b) => b.status === 'warning'))
  if (warning) return { kind: 'warning', budget: warning }
  return {
    kind: 'good',
    net: summary.net,
    saved: saved ?? { amount: 0, currency: summary.net.currency },
  }
}

/** The one with the highest ratio; on a tie, the first (budgets come sorted by name). */
function highestRatio(budgets: readonly BudgetProgress[]): BudgetProgress | undefined {
  return budgets.reduce<BudgetProgress | undefined>(
    (best, b) => (best === undefined || b.ratio > best.ratio ? b : best),
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
      return goodMessage(mood.net, mood.saved)
    case 'negative':
      return 'Este mes salió más de lo que entró.'
    case 'warning':
      return `Ojo: ${shortName(mood.budget.budget.category.name)} ya va por el ${Math.round(mood.budget.ratio * 100)}%.`
    case 'exceeded': {
      const sentence = `Te pasaste en ${shortName(mood.budget.budget.category.name)}.`
      return monthLeft(month, today)
        ? `${sentence} Tranqui, todavía queda mes para acomodarlo.`
        : sentence
    }
  }
}

/** "Te sobran" is what's left after saving: the result minus what went into goals. */
function goodMessage(net: Money, saved: Money): string {
  if (saved.amount > 0) {
    const left = { amount: net.amount - saved.amount, currency: net.currency }
    return left.amount > 0
      ? `¡Vas bárbaro! Ahorraste ${formatWholeMoney(saved)} y te sobran ${formatWholeMoney(left)}.`
      : `¡Vas bárbaro! Este mes ahorraste ${formatWholeMoney(saved)}.`
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
