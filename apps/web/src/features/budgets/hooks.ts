import type { BudgetInput, Money, Month, WeeklyBudgetInput } from '@chanchito/core'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import {
  copyBudgets,
  createBudget,
  createWeeklyBudget,
  deleteBudget,
  deleteWeeklyBudget,
  listBudgets,
  listWeeklyBudgets,
  updateBudgetAmount,
  updateWeeklyBudgetAmount,
} from './api'

export function budgetsQuery(month: Month) {
  return queryOptions({
    queryKey: [...queryKeys.budgets, month],
    queryFn: () => listBudgets(month),
  })
}

export function useBudgets(month: Month) {
  return useQuery(budgetsQuery(month))
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

/** Weekly budgets (spec 013): the same every week, so one query for all of them. */
export function weeklyBudgetsQuery() {
  return queryOptions({ queryKey: [...queryKeys.budgets, 'weekly'], queryFn: listWeeklyBudgets })
}

export function useWeeklyBudgets() {
  return useQuery(weeklyBudgetsQuery())
}

export function useCreateWeeklyBudget() {
  const invalidate = useInvalidateBudgets()
  return useMutation({
    mutationFn: (input: WeeklyBudgetInput) => createWeeklyBudget(input),
    onSettled: invalidate,
  })
}

export function useUpdateWeeklyBudgetAmount() {
  const invalidate = useInvalidateBudgets()
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: Money }) =>
      updateWeeklyBudgetAmount(id, amount),
    onSettled: invalidate,
  })
}

export function useDeleteWeeklyBudget() {
  const invalidate = useInvalidateBudgets()
  return useMutation({
    mutationFn: (id: string) => deleteWeeklyBudget(id),
    onSettled: invalidate,
  })
}
