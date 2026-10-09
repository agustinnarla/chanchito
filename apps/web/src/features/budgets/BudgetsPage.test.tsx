import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NewMovementButton } from '@/features/movements/NewMovementButton'
import { fakeDb, type FakeSeed } from '@/test/fake-db'
import { renderWithQuery } from '@/test/render-with-query'
import { BudgetsPage } from './BudgetsPage'

vi.mock(
  '@/features/categories/api',
  async () => (await import('@/test/fake-db')).fakeDb.categoriesApi,
)
vi.mock(
  '@/features/movements/api',
  async () => (await import('@/test/fake-db')).fakeDb.movementsApi,
)
vi.mock('./api', async () => (await import('@/test/fake-db')).fakeDb.budgetsApi)

const seed: FakeSeed = {
  categories: [
    { name: 'Supermercado', kind: 'expense' },
    { name: 'Transporte', kind: 'expense' },
    { name: 'Salidas', kind: 'expense', archived: true },
    { name: 'Farmacia', kind: 'expense' },
    { name: 'Sueldo', kind: 'income' },
  ],
  budgets: [
    { category: 'Supermercado', amount: 6000000 },
    { category: 'Transporte', amount: 2000000 },
    { category: 'Salidas', amount: 1000000 },
    { category: 'Supermercado', amount: 10000, currency: 'USD' },
    { category: 'Supermercado', amount: 5000000, month: '2026-09' },
  ],
  movements: [
    { category: 'Supermercado', amount: 4500000, occurredOn: '2026-10-07' },
    { category: 'Transporte', amount: 1900000, occurredOn: '2026-10-10' },
    { category: 'Salidas', amount: 1200000, occurredOn: '2026-10-20' },
    { category: 'Farmacia', amount: 300000, occurredOn: '2026-10-05' },
    { category: 'Supermercado', amount: 2000, currency: 'USD', occurredOn: '2026-10-02' },
    { category: 'Sueldo', amount: 9000000, occurredOn: '2026-10-01' },
    { category: 'Supermercado', amount: 777, occurredOn: '2026-09-30' },
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

async function items(list = 'Presupuestos en pesos') {
  return within(await screen.findByRole('list', { name: list })).getAllByRole('listitem')
}

function item(items: HTMLElement[], category: string) {
  const found = items.find((li) => li.textContent?.startsWith(category))
  if (!found) throw new Error(`No budget for ${category}`)
  return found
}

describe('BudgetsPage', () => {
  it('shows the current month by default', async () => {
    renderWithQuery(<BudgetsPage />, { route: '/presupuestos' })

    expect(screen.getByRole('heading', { name: 'Octubre 2026' })).toBeInTheDocument()
    expect(await items()).toHaveLength(3)
  })

  it('lists the budgets by category name with spent, limit and what is left', async () => {
    renderWithQuery(<BudgetsPage />, { route: '/presupuestos?mes=2026-10' })

    const list = await items()
    expect(list.map((li) => within(li).getByRole('progressbar').ariaLabel)).toEqual([
      'Gastado en Salidas',
      'Gastado en Supermercado',
      'Gastado en Transporte',
    ])
    expect(item(list, 'Salidas')).toHaveTextContent(/^Salidas\(archivada\)/)
    const supermercado = item(list, 'Supermercado')
    expect(supermercado).toHaveTextContent('$ 45.000,00 de $ 60.000,00')
    expect(supermercado).toHaveTextContent('Quedan $ 15.000,00')
    expect(
      within(supermercado).getByRole('progressbar', { name: 'Gastado en Supermercado' }),
    ).toHaveAttribute('aria-valuenow', '75')
  })

  it('warns when close to the limit', async () => {
    renderWithQuery(<BudgetsPage />, { route: '/presupuestos?mes=2026-10' })

    expect(item(await items(), 'Transporte')).toHaveTextContent(
      'Quedan $ 1.000,00 · Cerca del límite',
    )
  })

  it('says by how much the budget was exceeded, with the bar full', async () => {
    renderWithQuery(<BudgetsPage />, { route: '/presupuestos?mes=2026-10' })

    const salidas = item(await items(), 'Salidas')
    expect(salidas).toHaveTextContent('Te pasaste por $ 2.000,00')
    const bar = within(salidas).getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '100')
    expect(bar).toHaveAttribute('aria-valuetext', '120%')
  })

  it('sums budgets and spending per currency, and reports expenses without a budget', async () => {
    renderWithQuery(<BudgetsPage />, { route: '/presupuestos?mes=2026-10' })
    await items()

    expect(screen.getByText('Gastado $ 76.000,00 de $ 90.000,00')).toBeInTheDocument()
    expect(
      screen.getByText('Además, $ 3.000,00 en categorías sin presupuesto.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Gastado US$ 20,00 de US$ 100,00')).toBeInTheDocument()
    expect(item(await items('Presupuestos en dólares'), 'Supermercado')).toHaveTextContent(
      'Quedan US$ 80,00',
    )
  })

  it('leaves out a currency without budgets', async () => {
    renderWithQuery(<BudgetsPage />, { route: '/presupuestos?mes=2026-09' })

    expect(await items()).toHaveLength(1)
    expect(screen.queryByRole('list', { name: 'Presupuestos en dólares' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dólares' })).not.toBeInTheDocument()
  })

  it('says when a month has no budgets', async () => {
    renderWithQuery(<BudgetsPage />, { route: '/presupuestos?mes=2026-03' })

    expect(await screen.findByText('No hay presupuestos para marzo 2026.')).toBeInTheDocument()
  })

  it('moves between months and keeps the month in the URL', async () => {
    const { router } = renderWithQuery(<BudgetsPage />, { route: '/presupuestos?mes=2026-10' })
    const user = userEvent.setup()
    await items()

    await user.click(screen.getByRole('button', { name: 'Mes anterior' }))

    expect(screen.getByRole('heading', { name: 'Septiembre 2026' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?mes=2026-09')
    expect(item(await items(), 'Supermercado')).toHaveTextContent('$ 7,77 de $ 50.000,00')
  })

  it.each(['2026-13', 'hola'])('shows the current month for an invalid ?mes=%s', async (mes) => {
    renderWithQuery(<BudgetsPage />, { route: `/presupuestos?mes=${mes}` })

    expect(screen.getByRole('heading', { name: 'Octubre 2026' })).toBeInTheDocument()
  })

  it('updates the progress right after saving a movement', async () => {
    renderWithQuery(
      <>
        <NewMovementButton />
        <BudgetsPage />
      </>,
      { route: '/presupuestos?mes=2026-10' },
    )
    const user = userEvent.setup()
    await items()

    await user.click(screen.getByRole('button', { name: 'Nuevo movimiento' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Monto'), '20.000')
    await user.selectOptions(await within(dialog).findByLabelText('Categoría'), 'Supermercado')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    await vi.waitFor(async () =>
      expect(item(await items(), 'Supermercado')).toHaveTextContent('Te pasaste por $ 5.000,00'),
    )
  })

  it.each([
    ['budgets', () => fakeDb.budgetsApi.listBudgets],
    ['movements', () => fakeDb.movementsApi.listMovements],
  ])('shows an error when %s cannot be loaded and retries', async (_case, api) => {
    api().mockRejectedValueOnce(new Error('offline'))
    renderWithQuery(<BudgetsPage />, { route: '/presupuestos?mes=2026-10' })
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar los presupuestos.',
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await items()).toHaveLength(3)
  })
})
