import { currentMonth, parseMonth, type Month } from '@chanchito/core'
import { useSearchParams } from 'react-router'

/** Month param in the URL, in Spanish: ?mes=2026-10 */
export const MONTH_PARAM = 'mes'

/** The month in the URL (the current one if missing or invalid) and a way to change it. */
export function useMonthParam(): [Month, (month: Month) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const month = parseMonth(searchParams.get(MONTH_PARAM), currentMonth())

  function setMonth(next: Month) {
    setSearchParams((params) => {
      params.set(MONTH_PARAM, next)
      return params
    })
  }

  return [month, setMonth]
}
