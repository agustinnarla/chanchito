import { sortMovements, type Month } from '@chanchito/core'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { movementsApi } from '@/data/api'
import { queryKeys } from '@/lib/query-keys'

/** A month's movements. */
export function movementsQuery(month: Month) {
  return queryOptions({
    queryKey: [...queryKeys.movements, month],
    queryFn: () => movementsApi.listMovements(month),
  })
}

/** A month's movements, newest first. */
export function useMovements(month: Month) {
  return useQuery({ ...movementsQuery(month), select: sortMovements })
}
