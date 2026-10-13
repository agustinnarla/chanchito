import type { CryptoPurchaseInput } from '@chanchito/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { createPurchase, deletePurchase, listPurchases, updatePurchase } from './api'

export function usePurchases() {
  return useQuery({ queryKey: queryKeys.purchases, queryFn: listPurchases })
}

/** Mutations refetch the purchases when they finish, whether they worked or not. */
function usePurchaseMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.purchases }),
  })
}

export const useCreatePurchase = () =>
  usePurchaseMutation((input: CryptoPurchaseInput) => createPurchase(input))

export const useUpdatePurchase = () =>
  usePurchaseMutation(({ id, input }: { id: string; input: CryptoPurchaseInput }) =>
    updatePurchase(id, input),
  )

export const useDeletePurchase = () => usePurchaseMutation((id: string) => deletePurchase(id))
