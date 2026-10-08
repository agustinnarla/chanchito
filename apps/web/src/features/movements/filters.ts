import type { Category, CategoryKind, Currency, MovementFilters } from '@chanchito/core'

/** Filter params in the URL, in Spanish: ?tipo=gasto&categoria=<id>&moneda=USD */
export const FILTER_PARAMS = { kind: 'tipo', categoryId: 'categoria', currency: 'moneda' } as const

const KIND_PARAM: Record<CategoryKind, string> = { expense: 'gasto', income: 'ingreso' }
const CURRENCIES: Currency[] = ['ARS', 'USD']

/** Reads the filters from the URL, ignoring invalid values and unknown categories. */
export function readFilters(params: URLSearchParams, categories: Category[]): MovementFilters {
  const filters: MovementFilters = {}

  const kindParam = params.get(FILTER_PARAMS.kind)
  const kind = (Object.keys(KIND_PARAM) as CategoryKind[]).find((k) => KIND_PARAM[k] === kindParam)
  if (kind) filters.kind = kind

  const categoryId = params.get(FILTER_PARAMS.categoryId)
  if (categoryId && categories.some((c) => c.id === categoryId)) filters.categoryId = categoryId

  const currency = params.get(FILTER_PARAMS.currency)
  const knownCurrency = CURRENCIES.find((c) => c === currency)
  if (knownCurrency) filters.currency = knownCurrency

  return filters
}

/** Writes the filters into the URL params, keeping the others (like the month). */
export function writeFilters(params: URLSearchParams, filters: MovementFilters): URLSearchParams {
  const next = new URLSearchParams(params)
  const set = (key: string, value: string | undefined) =>
    value === undefined ? next.delete(key) : next.set(key, value)

  set(FILTER_PARAMS.kind, filters.kind && KIND_PARAM[filters.kind])
  set(FILTER_PARAMS.categoryId, filters.categoryId)
  set(FILTER_PARAMS.currency, filters.currency)
  return next
}

export function hasFilters(filters: MovementFilters): boolean {
  return Object.values(filters).some((value) => value !== undefined)
}
