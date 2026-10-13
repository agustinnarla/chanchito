import type { Accent } from '@chanchito/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { loadAccent, saveAccent } from './api'

export function useAccountAccent() {
  return useQuery({ queryKey: queryKeys.preferences, queryFn: loadAccent })
}

export function useSaveAccent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (accent: Accent) => saveAccent(accent),
    onSuccess: (_, accent) => queryClient.setQueryData(queryKeys.preferences, accent),
  })
}
