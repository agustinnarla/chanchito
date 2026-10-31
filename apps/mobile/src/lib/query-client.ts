import { QueryClient } from '@tanstack/react-query'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // One retry: on a phone a request can fail once while the connection comes back.
      queries: { retry: 1, staleTime: 30_000 },
    },
  })
}
