import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NewMovementButton } from '@/features/movements/NewMovementButton'
import { fakeDb, type FakeSeed } from '@/test/fake-db'
import { renderWithQuery } from '@/test/render-with-query'
import { HomePage } from './HomePage'

vi.mock(
  '@/features/categories/api',
  async () => (await import('@/test/fake-db')).fakeDb.categoriesApi,
)
vi.mock(
  '@/features/movements/api',
  async () => (await import('@/test/fake-db')).fakeDb.movementsApi,
)

const seed: FakeSeed = {
  categories: [
    { name: 'Supermercado', kind: 'expense' },
    { name: 'Sueldo', kind: 'income' },
  ],
  movements: [
    { category: 'Supermercado', amount: 100000, occurredOn: '2026-10-07' },
    { category: 'Sueldo', amount: 300000, occurredOn: '2026-10-01' },
    { category: 'Supermercado', amount: 99900, occurredOn: '2026-09-30' },
    { category: 'Sueldo', amount: 50000, currency: 'USD', occurredOn: '2026-11-01' },
  ],
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 15, 12, 0))
  fakeDb.reset(seed)
})

afterEach(() => {
  vi.useRealTimers()
})

/** The card of a currency as { Ingresos, Gastos, Resultado }. */
async function totals(name: 'Pesos' | 'Dólares') {
  const card = await screen.findByRole('region', { name })
  const terms = within(card).getAllByRole('term')
  const values = within(card).getAllByRole('definition')
  return Object.fromEntries(terms.map((term, i) => [term.textContent, values[i]?.textContent]))
}

describe('HomePage', () => {
  it("shows the current month's totals per currency, ignoring other months", async () => {
    renderWithQuery(<HomePage />)

    expect(screen.getByRole('heading', { name: 'Octubre 2026' })).toBeInTheDocument()
    expect(await totals('Pesos')).toEqual({
      Ingresos: '$ 3.000,00',
      Gastos: '$ 1.000,00',
      Resultado: '+$ 2.000,00',
    })
    expect(await totals('Dólares')).toEqual({
      Ingresos: 'US$ 0,00',
      Gastos: 'US$ 0,00',
      Resultado: 'US$ 0,00',
    })
  })

  it('shows a negative result when expenses exceed income', async () => {
    fakeDb.reset({
      ...seed,
      movements: [
        { category: 'Supermercado', amount: 15000, currency: 'USD', occurredOn: '2026-10-02' },
        { category: 'Sueldo', amount: 10000, currency: 'USD', occurredOn: '2026-10-03' },
      ],
    })
    renderWithQuery(<HomePage />)

    expect((await totals('Dólares')).Resultado).toBe('-US$ 50,00')
    expect((await totals('Pesos')).Resultado).toBe('$ 0,00')
  })

  it('links to the balance', async () => {
    const { router } = renderWithQuery(<HomePage />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('link', { name: 'Ver balance' }))

    expect(router.state.location.pathname).toBe('/balance')
  })

  it('updates the totals right after saving a movement', async () => {
    renderWithQuery(
      <>
        <NewMovementButton />
        <HomePage />
      </>,
    )
    const user = userEvent.setup()
    await totals('Pesos')

    await user.click(screen.getByRole('button', { name: 'Nuevo movimiento' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Monto'), '500')
    await user.selectOptions(await within(dialog).findByLabelText('Categoría'), 'Supermercado')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    await vi.waitFor(async () => expect((await totals('Pesos')).Gastos).toBe('$ 1.500,00'))
    expect((await totals('Pesos')).Resultado).toBe('+$ 1.500,00')
  })

  it('shows an error instead of a wrong total when the sum is too large', async () => {
    fakeDb.reset({
      ...seed,
      movements: [
        { category: 'Sueldo', amount: Number.MAX_SAFE_INTEGER, occurredOn: '2026-10-01' },
        { category: 'Sueldo', amount: 1, occurredOn: '2026-10-02' },
      ],
    })
    renderWithQuery(<HomePage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo calcular el balance del mes.',
    )
    expect(screen.queryByRole('region', { name: 'Pesos' })).not.toBeInTheDocument()
  })

  it('retries after an error loading the movements', async () => {
    fakeDb.movementsApi.listMovements.mockRejectedValueOnce(new Error('offline'))
    renderWithQuery(<HomePage />)
    const user = userEvent.setup()

    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect((await totals('Pesos')).Ingresos).toBe('$ 3.000,00')
  })
})
