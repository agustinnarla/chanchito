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
    { name: 'Supermercado', kind: 'expense', emoji: 'shopping_cart' },
    { name: 'Sueldo', kind: 'income', emoji: 'briefcase' },
  ],
  movements: [
    { category: 'Supermercado', amount: 100000, occurredOn: '2026-10-07', description: 'Coto' },
    { category: 'Sueldo', amount: 300000, occurredOn: '2026-10-01' },
    { category: 'Supermercado', amount: 99900, occurredOn: '2026-09-30' },
    { category: 'Sueldo', amount: 50000, currency: 'USD', occurredOn: '2026-10-02' },
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

/** The figures of the month, by their labels. */
async function figures() {
  await screen.findByText('Resultado del mes')
  const terms = screen.getAllByRole('term').map((t) => t.textContent)
  const values = screen.getAllByRole('definition').map((d) => d.textContent)
  const byTerm = Object.fromEntries(terms.map((t, i) => [t, values[i]]))
  return {
    result: byTerm['Resultado del mes'],
    Ingresos: byTerm.Ingresos,
    Gastos: byTerm.Gastos,
  }
}

function latest(month = 'octubre 2026') {
  return within(screen.getByRole('list', { name: `Últimos movimientos de ${month}` })).getAllByRole(
    'listitem',
  )
}

describe('HomePage', () => {
  it("shows the current month's result in pesos, ignoring other months", async () => {
    renderWithQuery(<HomePage />)

    expect(screen.getByRole('heading', { name: 'Octubre 2026' })).toBeInTheDocument()
    expect(await figures()).toEqual({
      result: '+$ 2.000,00',
      Ingresos: '$ 3.000,00',
      Gastos: '$ 1.000,00',
    })
  })

  it('switches to dollars without mixing currencies', async () => {
    renderWithQuery(<HomePage />)
    const user = userEvent.setup()
    await figures()

    await user.click(screen.getByRole('radio', { name: 'USD' }))

    expect(screen.getByRole('radio', { name: 'USD' })).toHaveAttribute('aria-checked', 'true')
    expect(await figures()).toEqual({
      result: '+US$ 500,00',
      Ingresos: 'US$ 500,00',
      Gastos: 'US$ 0,00',
    })
  })

  it('shows a negative result when expenses exceed income', async () => {
    fakeDb.reset({
      ...seed,
      movements: [{ category: 'Supermercado', amount: 5000, occurredOn: '2026-10-02' }],
    })
    renderWithQuery(<HomePage />)

    expect((await figures()).result).toBe('-$ 50,00')
  })

  it("lists the month's latest movements, newest first, with their emoji", async () => {
    renderWithQuery(<HomePage />)
    await figures()

    const items = await vi.waitFor(() => latest())
    expect(items.map((li) => li.textContent)).toEqual([
      'Supermercado07/10/2026 · Coto-$ 1.000,00',
      'Sueldo02/10/2026+US$ 500,00',
      'Sueldo01/10/2026+$ 3.000,00',
    ])
    expect(items[0]?.querySelector('img')).toHaveAttribute('src', '/emoji/shopping_cart.webp')
  })

  it('shows at most 6 movements', async () => {
    fakeDb.reset({
      ...seed,
      movements: Array.from({ length: 8 }, (_, i) => ({
        category: 'Supermercado',
        amount: 100 + i,
        occurredOn: `2026-10-0${i + 1}`,
      })),
    })
    renderWithQuery(<HomePage />)

    expect(await vi.waitFor(() => latest())).toHaveLength(6)
  })

  it('links to the balance and to every movement of the month', async () => {
    renderWithQuery(<HomePage />, { route: '/?mes=2026-09' })

    expect(await screen.findByRole('link', { name: 'Ver balance' })).toHaveAttribute(
      'href',
      '/balance?mes=2026-09',
    )
    expect(screen.getByRole('link', { name: 'Ver todos' })).toHaveAttribute(
      'href',
      '/movimientos?mes=2026-09',
    )
  })

  it('moves between months', async () => {
    const { router } = renderWithQuery(<HomePage />)
    const user = userEvent.setup()
    await figures()

    await user.click(screen.getByRole('button', { name: 'Mes anterior' }))

    expect(router.state.location.search).toBe('?mes=2026-09')
    expect((await figures()).Gastos).toBe('$ 999,00')
  })

  it('offers to add the first movement in an empty month', async () => {
    renderWithQuery(<HomePage />, { route: '/?mes=2026-03' })
    const user = userEvent.setup()

    expect(await screen.findByText('No hay movimientos en marzo 2026.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cargar el primero' }))

    expect(await screen.findByRole('dialog', { name: 'Nuevo movimiento' })).toBeInTheDocument()
  })

  it('updates right after saving a movement', async () => {
    renderWithQuery(
      <>
        <NewMovementButton />
        <HomePage />
      </>,
    )
    const user = userEvent.setup()
    await figures()

    await user.click(screen.getByRole('button', { name: 'Nuevo movimiento' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Monto'), '500')
    await user.selectOptions(await within(dialog).findByLabelText('Categoría'), 'Supermercado')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    await vi.waitFor(async () => expect((await figures()).Gastos).toBe('$ 1.500,00'))
    expect(latest()).toHaveLength(4)
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
  })

  it('retries after an error loading the movements', async () => {
    fakeDb.movementsApi.listMovements.mockRejectedValue(new Error('offline'))
    renderWithQuery(<HomePage />)
    const user = userEvent.setup()

    await vi.waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2))
    expect(screen.getByText('No se pudieron cargar los movimientos.')).toBeInTheDocument()
    fakeDb.movementsApi.listMovements.mockRestore()
    fakeDb.reset(seed)
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect((await figures()).Ingresos).toBe('$ 3.000,00')
  })
})
