import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeDb } from '@/test/fake-db'
import { renderWithQuery } from '@/test/render-with-query'
import { usePrefetchSections } from './use-prefetch-sections'

vi.mock(
  '@/features/categories/api',
  async () => (await import('@/test/fake-db')).fakeDb.categoriesApi,
)
vi.mock(
  '@/features/movements/api',
  async () => (await import('@/test/fake-db')).fakeDb.movementsApi,
)
vi.mock('@/features/budgets/api', async () => (await import('@/test/fake-db')).fakeDb.budgetsApi)

beforeEach(() => {
  fakeDb.reset({ categories: [{ name: 'Supermercado', kind: 'expense' }] })
  vi.clearAllMocks()
})

function Prefetch() {
  usePrefetchSections()
  return null
}

describe('usePrefetchSections', () => {
  it("loads the categories and the month's and its neighbors' movements and budgets", async () => {
    const { router } = renderWithQuery(<Prefetch />, { route: '/?mes=2026-10' })

    await waitFor(() => expect(fakeDb.categoriesApi.listCategories).toHaveBeenCalledOnce())
    for (const month of ['2026-09', '2026-10', '2026-11']) {
      expect(fakeDb.movementsApi.listMovements).toHaveBeenCalledWith(month)
      expect(fakeDb.budgetsApi.listBudgets).toHaveBeenCalledWith(month)
    }

    // Moving one month ahead loads its new neighbor
    await router.navigate('/?mes=2026-11')
    await waitFor(() => expect(fakeDb.movementsApi.listMovements).toHaveBeenCalledWith('2026-12'))
    expect(fakeDb.budgetsApi.listBudgets).toHaveBeenCalledWith('2026-12')
  })
})
