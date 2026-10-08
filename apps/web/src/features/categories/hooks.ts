import { sortCategories, type Category, type CategoryInput } from '@chanchito/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import {
  createCategory,
  createSuggestedCategories,
  deleteCategory,
  listCategories,
  renameCategory,
  restoreCategory,
} from './api'

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
    select: sortCategories,
  })
}

/**
 * Mutations refetch the list when they finish, whether they worked or not. Movements show
 * their category's name and archived state, so they are refetched too.
 */
function useInvalidateCategories() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
      queryClient.invalidateQueries({ queryKey: queryKeys.movements }),
    ])
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: (input: CategoryInput) => createCategory(input),
    onSettled: invalidate,
  })
}

export function useRenameCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: ({ category, name }: { category: Category; name: string }) =>
      renameCategory(category, name),
    onSettled: invalidate,
  })
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: (category: Category) => deleteCategory(category),
    onSettled: invalidate,
  })
}

export function useCreateSuggestedCategories() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: (existing: Category[]) => createSuggestedCategories(existing),
    onSettled: invalidate,
  })
}

export function useRestoreCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: (category: Category) => restoreCategory(category),
    onSettled: invalidate,
  })
}
