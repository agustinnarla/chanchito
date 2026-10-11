import { summarizeMonth, type Month } from '@chanchito/core'
import { useQuery } from '@tanstack/react-query'
import { movementsQuery } from '@/features/movements/hooks'

/** The month's summary, calculated from its movements (never stored). */
export function useMonthSummary(month: Month) {
  return useQuery({ ...movementsQuery(month), select: summarizeMonth })
}
