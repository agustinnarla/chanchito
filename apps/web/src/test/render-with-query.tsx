import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { Toaster } from '@/components/ui/sonner'

/**
 * Renders with a fresh QueryClient (no retries, so errors show up right away), a router
 * (for links) and toasts.
 */
export function renderWithQuery(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
      <Toaster />
    </QueryClientProvider>,
  )
}
