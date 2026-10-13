import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { Toaster } from './components/ui/sonner'
import { router } from './router'
import { ThemeProvider } from './theme/ThemeProvider'

// Data stays fresh for 30 s: going back to a section or month shows it without refetching.
// Changes refetch it anyway (mutations invalidate their queries).
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
