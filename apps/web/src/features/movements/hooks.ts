import { sortMovements, type Month, type MovementInput } from '@chanchito/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { createMovement, deleteMovement, listMovements, updateMovement } from './api'

export function useMovements(month: Month) {
  return useQuery({
    queryKey: [...queryKeys.movements, month],
    queryFn: () => listMovements(month),
    select: sortMovements,
  })
}

/** Mutations refetch every month's movements when they finish, whether they worked or not. */
function useInvalidateMovements() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.movements })
}

export function useCreateMovement() {
  const invalidate = useInvalidateMovements()
  return useMutation({
    mutationFn: (input: MovementInput) => createMovement(input),
    onSettled: invalidate,
  })
}

export function useUpdateMovement() {
  const invalidate = useInvalidateMovements()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MovementInput }) => updateMovement(id, input),
    onSettled: invalidate,
  })
}

export function useDeleteMovement() {
  const invalidate = useInvalidateMovements()
  return useMutation({
    mutationFn: (id: string) => deleteMovement(id),
    onSettled: invalidate,
  })
}
