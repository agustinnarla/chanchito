import { z } from 'zod'

/** A calendar date without time or timezone: 'aaaa-mm-dd'. */
export type IsoDate = string

/** A calendar month: 'aaaa-mm'. */
export type Month = string

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

function isRealDate(value: string): boolean {
  const match = ISO_DATE.exec(value)
  if (!match) return false
  const [, y, m, d] = match.map(Number) as [number, number, number, number]
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

export const IsoDateSchema = z.string().refine(isRealDate, { message: 'Ingresá una fecha válida.' })

export const MonthSchema = z.string().regex(MONTH)

/** Today's date in the device's local timezone (never the UTC date). */
export function todayIso(now: Date = new Date()): IsoDate {
  return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function currentMonth(now: Date = new Date()): Month {
  return monthOf(todayIso(now))
}

export function monthOf(date: IsoDate): Month {
  return date.slice(0, 7)
}

/** Returns `value` if it is a valid month, otherwise `fallback`. */
export function parseMonth(value: string | null | undefined, fallback: Month): Month {
  return value != null && MONTH.test(value) ? value : fallback
}

function splitMonth(month: Month): [year: number, monthIndex: number] {
  const [year, m] = month.split('-').map(Number) as [number, number]
  return [year, m - 1]
}

export function addMonths(month: Month, delta: number): Month {
  const [year, monthIndex] = splitMonth(month)
  const total = year * 12 + monthIndex + delta
  return `${pad(Math.floor(total / 12), 4)}-${pad((total % 12) + 1)}`
}

/** Date range of a month: `from` inclusive, `to` exclusive (first day of the next month). */
export function monthRange(month: Month): { from: IsoDate; to: IsoDate } {
  return { from: `${month}-01`, to: `${addMonths(month, 1)}-01` }
}

/** 'aaaa-mm-dd' → 'dd/mm/aaaa'. */
export function formatDate(date: IsoDate): string {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

/** '2026-10' → 'Octubre 2026'. */
export function formatMonthLabel(month: Month): string {
  const [year, monthIndex] = splitMonth(month)
  return `${MONTH_NAMES[monthIndex]} ${year}`
}
