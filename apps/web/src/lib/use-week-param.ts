import { currentWeek, parseWeek, type Week } from '@chanchito/core'
import { useSearchParams } from 'react-router'

/** Week param in the URL, in Spanish: ?semana=2026-10-12 (its Monday). */
export const WEEK_PARAM = 'semana'

/** The week in the URL (the current one if missing or invalid) and a way to change it. */
export function useWeekParam(): [Week, (week: Week) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const week = parseWeek(searchParams.get(WEEK_PARAM), currentWeek())

  function setWeek(next: Week) {
    setSearchParams((params) => {
      params.set(WEEK_PARAM, next)
      return params
    })
  }

  return [week, setWeek]
}
