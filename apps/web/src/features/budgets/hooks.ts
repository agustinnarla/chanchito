import type { BudgetInput, Money, Month } from '@chanchito/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { copyBudgets, createBudget, deleteBudget, listBudgets, updateBudgetAmount } from './api'

export function useBudgets(month: Month) {
  return useQuery({
    queryKey: [...queryKeys.budgets, month],
    queryFn: () => listBudgets(month),
  })
}

/** Mutations refetch every month's budgets when they finish, whether they worked or not. */
function useInvalidateBudgets() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.budgets })
}

export function useCreateBudget() {
  const invalidate = useInvalidateBudgets()
  return useMutation({
    mutationFn: (input: BudgetInput) => createBudget(input),
    onSettled: invalidate,
  })
}

export function useUpdateBudgetAmount() {
  const invalidate = useInvalidateBudgets()
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: Money }) => updateBudgetAmount(id, amount),
    onSettled: invalidate,
  })
}

export function useDeleteBudget() {
  const invalidate = useInvalidateBudgets()
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSettled: invalidate,
  })
}

export function useCopyBudgets() {
  const invalidate = useInvalidateBudgets()
  return useMutation({
    mutationFn: (inputs: BudgetInput[]) => copyBudgets(inputs),
    onSettled: invalidate,
  })
}
