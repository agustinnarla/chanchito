import {
  formatMonthName,
  IsoDateSchema,
  monthOf,
  todayIso,
  type IsoDate,
  type Month,
} from './dates'

/** A week, as the date of its Monday: '2026-10-12'. Weeks go from Monday to Sunday (spec 013). */
export type Week = IsoDate

const toUtc = (date: IsoDate) => {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d))
}

const toIso = (date: Date): IsoDate => date.toISOString().slice(0, 10)

function addDays(date: IsoDate, days: number): IsoDate {
  const utc = toUtc(date)
  utc.setUTCDate(utc.getUTCDate() + days)
  return toIso(utc)
}

/** The Monday of the week `date` is in. Computed in UTC, so the time zone can't shift it. */
export function weekOf(date: IsoDate): Week {
  const sinceMonday = (toUtc(date).getUTCDay() + 6) % 7
  return addDays(date, -sinceMonday)
}

export function currentWeek(now: Date = new Date()): Week {
  return weekOf(todayIso(now))
}

export function addWeeks(week: Week, delta: number): Week {
  return addDays(week, delta * 7)
}

/** Date range of a week: `from` its Monday (inclusive), `to` the next Monday (exclusive). */
export function weekRange(week: Week): { from: IsoDate; to: IsoDate } {
  return { from: week, to: addWeeks(week, 1) }
}

/** The month of its Monday and, if different, of its Sunday: where its movements are. */
export function weekMonths(week: Week): Month[] {
  const months = [monthOf(week), monthOf(addDays(week, 6))]
  return months[0] === months[1] ? [months[0] as Month] : months
}

/** Any valid date gives its week; anything else, `fallback`. */
export function parseWeek(value: string | null | undefined, fallback: Week): Week {
  return value != null && IsoDateSchema.safeParse(value).success ? weekOf(value) : fallback
}

/**
 * "Semana del 12 al 18 de octubre", "Semana del 28 de septiembre al 4 de octubre", and with the
 * years when it crosses one.
 */
export function formatWeekLabel(week: Week): string {
  const end = addDays(week, 6)
  const [startYear, startMonth, startDay] = week.split('-')
  const [endYear, endMonth, endDay] = end.split('-')
  const day = (d: string | undefined) => String(Number(d))
  const monthName = (year: string | undefined, month: string | undefined) =>
    formatMonthName(`${year}-${month}`)

  if (startYear !== endYear) {
    return `Semana del ${day(startDay)} de ${monthName(startYear, startMonth)} de ${startYear} al ${day(endDay)} de ${monthName(endYear, endMonth)} de ${endYear}`
  }
  if (startMonth !== endMonth) {
    return `Semana del ${day(startDay)} de ${monthName(startYear, startMonth)} al ${day(endDay)} de ${monthName(endYear, endMonth)}`
  }
  return `Semana del ${day(startDay)} al ${day(endDay)} de ${monthName(endYear, endMonth)}`
}
