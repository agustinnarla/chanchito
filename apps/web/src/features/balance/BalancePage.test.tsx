import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MovementsPage } from '@/features/movements/MovementsPage'
import { NewMovementButton } from '@/features/movements/NewMovementButton'
import { fakeDb, type FakeSeed } from '@/test/fake-db'
import { renderWithQuery } from '@/test/render-with-query'
import { BalancePage } from './BalancePage'

vi.mock(
  '@/features/categories/api',
  async () => (await import('@/test/fake-db')).fakeDb.categoriesApi,
)
vi.mock(
  '@/features/movements/api',
  async () => (await import('@/test/fake-db')).fakeDb.movementsApi,
)
vi.mock('@/features/savings/api', async () => (await import('@/test/fake-db')).fakeDb.savingsApi)

const seed: FakeSeed = {
  categories: [
    { name: 'Supermercado', kind: 'expense', emoji: 'shopping_cart' },
    { name: 'Transporte', kind: 'expense' },
    { name: 'Salidas', kind: 'expense', archived: true },
    { name: 'Sueldo', kind: 'income' },
  ],
  movements: [
    { category: 'Transporte', amount: 30000, occurredOn: '2026-10-03' },
    { category: 'Supermercado', amount: 40000, occurredOn: '2026-10-07' },
    { category: 'Salidas', amount: 10000, occurredOn: '2026-10-31' },
    { category: 'Supermercado', amount: 20000, occurredOn: '2026-10-20' },
    { category: 'Sueldo', amount: 500000, occurredOn: '2026-10-01' },
    { category: 'Sueldo', amount: 10000, currency: 'USD', occurredOn: '2026-10-01' },
    { category: 'Supermercado', amount: 99900, occurredOn: '2026-09-30' },
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

/** The month's figures, by their labels. */
async function figures() {
  await screen.findByText('Resultado')
  const terms = screen.getAllByRole('term').map((t) => t.textContent)
  const values = screen.getAllByRole('definition').map((d) => d.textContent)
  return Object.fromEntries(terms.map((t, i) => [t, values[i]]))
}

/** The rows of a breakdown table as [category, amount, share]. */
async function breakdown(name: string) {
  const table = await screen.findByRole('table', { name })
  return within(table)
    .getAllByRole('row')
    .filter((row) => within(row).queryAllByRole('cell').length > 0)
    .map((row) =>
      [within(row).getByRole('rowheader'), ...within(row).getAllByRole('cell')].map(
        (cell) => cell.textContent,
      ),
    )
}

describe('BalancePage', () => {
  it('shows the current month by default, in pesos, and switches to dollars', async () => {
    renderWithQuery(<BalancePage />, { route: '/balance' })
    const user = userEvent.setup()

    expect(screen.getByRole('heading', { name: 'Octubre 2026' })).toBeInTheDocument()
    expect(await figures()).toEqual({
      Ingresos: '$ 5.000,00',
      Gastos: '$ 1.000,00',
      Resultado: '+$ 4.000,00',
    })

    await user.click(screen.getByRole('radio', { name: 'USD' }))

    expect(await figures()).toEqual({
      Ingresos: 'US$ 100,00',
      Gastos: 'US$ 0,00',
      Resultado: '+US$ 100,00',
    })
  })

  it('breaks expenses down by category, largest first, with their share', async () => {
    renderWithQuery(<BalancePage />, { route: '/balance?mes=2026-10' })

    expect(await breakdown('Gastos en pesos por categoría')).toEqual([
      ['Supermercado', '$ 600,00', '60%'],
      ['Transporte', '$ 300,00', '30%'],
      ['Salidas(archivada)', '$ 100,00', '10%'],
    ])
    expect(await breakdown('Ingresos en pesos por categoría')).toEqual([
      ['Sueldo', '$ 5.000,00', '100%'],
    ])
  })

  it('shows the emoji of each category', async () => {
    renderWithQuery(<BalancePage />, { route: '/balance?mes=2026-10' })

    const table = await screen.findByRole('table', { name: 'Gastos en pesos por categoría' })
    expect(within(table).getAllByRole('row')[1]?.querySelector('img')).toHaveAttribute(
      'src',
      '/emoji/shopping_cart.webp',
    )
  })

  it('shows "<1%" for a share that rounds to zero', async () => {
    fakeDb.reset({
      ...seed,
      movements: [
        { category: 'Supermercado', amount: 100000, occurredOn: '2026-10-07' },
        { category: 'Transporte', amount: 100, occurredOn: '2026-10-07' },
      ],
    })
    renderWithQuery(<BalancePage />, { route: '/balance?mes=2026-10' })

    expect(await breakdown('Gastos en pesos por categoría')).toEqual([
      ['Supermercado', '$ 1.000,00', '100%'],
      ['Transporte', '$ 1,00', '<1%'],
    ])
  })

  it('says when a currency has no movements of a kind', async () => {
    renderWithQuery(<BalancePage />, { route: '/balance?mes=2026-10' })
    const user = userEvent.setup()
    await breakdown('Gastos en pesos por categoría')
    await user.click(screen.getByRole('radio', { name: 'USD' }))

    expect(await screen.findByText('No hay gastos en dólares este mes.')).toBeInTheDocument()
    expect(await breakdown('Ingresos en dólares por categoría')).toEqual([
      ['Sueldo', 'US$ 100,00', '100%'],
    ])
  })

  it('says when a month has no movements, with the totals in zero', async () => {
    renderWithQuery(<BalancePage />, { route: '/balance?mes=2026-03' })

    expect(await screen.findByText('No hay movimientos en marzo 2026.')).toBeInTheDocument()
    expect((await figures()).Resultado).toBe('$ 0,00')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('moves between months and keeps the month in the URL', async () => {
    const { router } = renderWithQuery(<BalancePage />, { route: '/balance?mes=2026-10' })
    const user = userEvent.setup()
    await breakdown('Gastos en pesos por categoría')

    await user.click(screen.getByRole('button', { name: 'Mes anterior' }))

    expect(screen.getByRole('heading', { name: 'Septiembre 2026' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?mes=2026-09')
    expect(await breakdown('Gastos en pesos por categoría')).toEqual([
      ['Supermercado', '$ 999,00', '100%'],
    ])
  })

  it.each(['2026-13', 'hola'])('shows the current month for an invalid ?mes=%s', async (mes) => {
    renderWithQuery(<BalancePage />, { route: `/balance?mes=${mes}` })

    expect(screen.getByRole('heading', { name: 'Octubre 2026' })).toBeInTheDocument()
  })

  it('updates right after saving a movement', async () => {
    renderWithQuery(
      <>
        <NewMovementButton />
        <BalancePage />
      </>,
      { route: '/balance?mes=2026-10' },
    )
    const user = userEvent.setup()
    await breakdown('Gastos en pesos por categoría')

    await user.click(screen.getByRole('button', { name: 'Nuevo movimiento' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Monto'), '600')
    await user.click(await within(dialog).findByRole('radio', { name: 'Transporte' }))
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    await vi.waitFor(async () =>
      expect(await breakdown('Gastos en pesos por categoría')).toEqual([
        ['Transporte', '$ 900,00', '56%'],
        ['Supermercado', '$ 600,00', '38%'],
        ['Salidas(archivada)', '$ 100,00', '6%'],
      ]),
    )
  })

  it('updates after editing and deleting a movement', async () => {
    renderWithQuery(
      <>
        <MovementsPage />
        <BalancePage />
      </>,
      { route: '/?mes=2026-10' },
    )
    const user = userEvent.setup()
    await breakdown('Gastos en pesos por categoría')

    await user.click(
      await screen.findByRole('button', {
        name: 'Acciones del movimiento de Salidas del 31/10/2026',
      }),
    )
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }))
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Eliminar',
      }),
    )

    await vi.waitFor(async () =>
      expect(await breakdown('Gastos en pesos por categoría')).toEqual([
        ['Supermercado', '$ 600,00', '67%'],
        ['Transporte', '$ 300,00', '33%'],
      ]),
    )

    await user.click(
      screen.getByRole('button', { name: 'Acciones del movimiento de Transporte del 03/10/2026' }),
    )
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    const dialog = await screen.findByRole('dialog')
    await user.clear(within(dialog).getByLabelText('Monto'))
    await user.type(within(dialog).getByLabelText('Monto'), '900')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    await vi.waitFor(async () =>
      expect(await breakdown('Gastos en pesos por categoría')).toEqual([
        ['Transporte', '$ 900,00', '60%'],
        ['Supermercado', '$ 600,00', '40%'],
      ]),
    )
  })

  it('shows an error when movements cannot be loaded and retries', async () => {
    fakeDb.movementsApi.listMovements.mockRejectedValueOnce(new Error('offline'))
    renderWithQuery(<BalancePage />, { route: '/balance?mes=2026-10' })
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo calcular el balance del mes.',
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await breakdown('Gastos en pesos por categoría')).toHaveLength(3)
  })

  it("shows what was saved this month and what's left, without counting it as an expense", async () => {
    fakeDb.reset({
      ...seed,
      goals: [{ name: 'Celular nuevo' }],
      contributions: [
        { goal: 'Celular nuevo', amount: 80000, occurredOn: '2026-10-10' },
        { goal: 'Celular nuevo', amount: 99999, occurredOn: '2026-09-10' },
      ],
    })
    renderWithQuery(<BalancePage />, { route: '/balance' })

    await vi.waitFor(async () =>
      expect(await figures()).toMatchObject({
        Gastos: '$ 1.000,00',
        Resultado: '+$ 4.000,00',
        Ahorraste: '$ 800,00',
        'Te queda': '+$ 3.200,00',
      }),
    )
  })
})
