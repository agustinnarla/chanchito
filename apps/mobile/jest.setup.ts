// Every test runs against in-memory fakes: Supabase auth and the data layer never hit the network.
import { fakeAuth } from '@/test/fake-supabase-auth'
import { fakeData } from '@/test/fake-data'

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: jest.requireActual('@/test/fake-supabase-auth').fakeAuth },
}))

jest.mock('@/data/api', () => {
  const { fakeData } = jest.requireActual('@/test/fake-data')
  return { categoriesApi: fakeData.categoriesApi, movementsApi: fakeData.movementsApi }
})

// No retries in tests: a failing request shows its error right away.
jest.mock('@/lib/query-client', () => ({
  createQueryClient: () =>
    new (jest.requireActual('@tanstack/react-query').QueryClient)({
      defaultOptions: { queries: { retry: false } },
    }),
}))

beforeEach(() => {
  fakeAuth.reset()
  fakeData.reset()
})
