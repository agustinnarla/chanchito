import type { Month } from '@chanchito/core'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { listBudgets } from './api'

export function useBudgets(month: Month) {
  return useQuery({
    queryKey: [...queryKeys.budgets, month],
    queryFn: () => listBudgets(month),
  })
}
