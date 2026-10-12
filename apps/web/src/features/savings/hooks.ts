import type { ContributionInput, Money, SavingsGoalInput } from '@chanchito/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import {
  createContribution,
  createGoal,
  deleteContribution,
  deleteGoal,
  listContributions,
  listGoals,
  setGoalArchived,
  updateContribution,
  updateGoal,
} from './api'

export function useGoals() {
  return useQuery({ queryKey: [...queryKeys.savings, 'goals'], queryFn: listGoals })
}

export function useContributions() {
  return useQuery({ queryKey: [...queryKeys.savings, 'contributions'], queryFn: listContributions })
}

/** Mutations refetch goals and contributions when they finish, whether they worked or not. */
function useSavingsMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.savings }),
  })
}

export const useCreateGoal = () =>
  useSavingsMutation((input: SavingsGoalInput) => createGoal(input))

export const useUpdateGoal = () =>
  useSavingsMutation(
    ({
      id,
      changes,
    }: {
      id: string
      changes: Pick<SavingsGoalInput, 'name' | 'emoji' | 'target'>
    }) => updateGoal(id, changes),
  )

export const useSetGoalArchived = () =>
  useSavingsMutation(({ id, archived }: { id: string; archived: boolean }) =>
    setGoalArchived(id, archived),
  )

export const useDeleteGoal = () => useSavingsMutation((id: string) => deleteGoal(id))

export const useCreateContribution = () =>
  useSavingsMutation((input: ContributionInput) => createContribution(input))

export const useUpdateContribution = () =>
  useSavingsMutation(
    ({ id, changes }: { id: string; changes: { amount: Money; occurredOn: string } }) =>
      updateContribution(id, changes),
  )

export const useDeleteContribution = () =>
  useSavingsMutation((id: string) => deleteContribution(id))
