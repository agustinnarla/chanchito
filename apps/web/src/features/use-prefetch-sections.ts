import { addMonths } from '@chanchito/core'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { budgetsQuery } from '@/features/budgets/hooks'
import { categoriesQuery } from '@/features/categories/hooks'
import { movementsQuery } from '@/features/movements/hooks'
import { useMonthParam } from '@/lib/use-month-param'

/**
 * Loads in the background what the sections need for the month in the URL and the months next
 * to it, so changing section or month shows the data right away instead of "Cargando…".
 */
export function usePrefetchSections() {
  const queryClient = useQueryClient()
  const [month] = useMonthParam()

  useEffect(() => {
    void queryClient.prefetchQuery(categoriesQuery())
    for (const m of [month, addMonths(month, -1), addMonths(month, 1)]) {
      void queryClient.prefetchQuery(movementsQuery(m))
      void queryClient.prefetchQuery(budgetsQuery(m))
    }
  }, [queryClient, month])
}
