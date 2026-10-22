import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '@/data/api'
import { queryKeys } from '@/lib/query-keys'

/** All categories, active and archived. They're created and edited on the web. */
export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: () => categoriesApi.listCategories() })
}
