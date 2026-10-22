import { sortMovements, type Month, type MovementInput } from '@chanchito/core'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

/** Mutations refetch every month's movements when they finish, whether they worked or not. */
function useInvalidateMovements() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.movements })
}

export function useCreateMovement() {
  const invalidate = useInvalidateMovements()
  return useMutation({
    mutationFn: (input: MovementInput) => movementsApi.createMovement(input),
    onSettled: invalidate,
  })
}

export function useUpdateMovement() {
  const invalidate = useInvalidateMovements()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MovementInput }) =>
      movementsApi.updateMovement(id, input),
    onSettled: invalidate,
  })
}

export function useDeleteMovement() {
  const invalidate = useInvalidateMovements()
  return useMutation({
    mutationFn: (id: string) => movementsApi.deleteMovement(id),
    onSettled: invalidate,
  })
}
