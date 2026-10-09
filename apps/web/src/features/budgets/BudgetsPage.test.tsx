import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NewMovementButton } from '@/features/movements/NewMovementButton'
import { fakeDb, type FakeSeed } from '@/test/fake-db'
import { renderWithQuery } from '@/test/render-with-query'
import { BudgetsPage } from './BudgetsPage'
import { BudgetError } from './errors'

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

  describe('create', () => {
    async function openNew(route = '/presupuestos?mes=2026-10') {
      renderWithQuery(<BudgetsPage />, { route })
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Nuevo presupuesto' }))
      const dialog = await screen.findByRole('dialog', { name: 'Nuevo presupuesto' })
      await within(dialog).findByLabelText('Categoría')
      return { user, dialog }
    }

    it('adds a budget to the month being viewed', async () => {
      const { user, dialog } = await openNew('/presupuestos?mes=2026-11')
      expect(dialog).toHaveTextContent('Para noviembre 2026.')

      await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Farmacia')
      await user.click(within(dialog).getByRole('radio', { name: 'USD' }))
      await user.type(within(dialog).getByLabelText('Monto'), '50')
      await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

      expect(await screen.findByText('Presupuesto guardado')).toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(item(await items('Presupuestos en dólares'), 'Farmacia')).toHaveTextContent(
        'US$ 0,00 de US$ 50,00',
      )
      expect(fakeDb.budgets().find((b) => b.category.name === 'Farmacia')?.month).toBe('2026-11')
    })

    it('only offers active expense categories', async () => {
      const { dialog } = await openNew()

      const options = within(within(dialog).getByLabelText('Categoría'))
        .getAllByRole('option')
        .map((o) => o.textContent)
      expect(options).toEqual(['Elegí una categoría', 'Farmacia', 'Supermercado', 'Transporte'])
    })

    it.each([
      ['', 'Ingresá un monto.'],
      ['0', 'El monto tiene que ser mayor a 0.'],
      ['-5', 'El monto no puede ser negativo.'],
      ['12,345', 'El monto puede tener hasta 2 decimales.'],
    ])('rejects the amount %j', async (amount, message) => {
      const { user, dialog } = await openNew()

      await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Farmacia')
      if (amount) await user.type(within(dialog).getByLabelText('Monto'), amount)
      await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

      expect(within(dialog).getByLabelText('Monto')).toHaveAccessibleDescription(message)
      expect(fakeDb.budgetsApi.createBudget).not.toHaveBeenCalled()
    })

    it('requires a category', async () => {
      const { user, dialog } = await openNew()

      await user.type(within(dialog).getByLabelText('Monto'), '100')
      await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

      expect(within(dialog).getByLabelText('Categoría')).toHaveAccessibleDescription(
        'Elegí una categoría.',
      )
      expect(fakeDb.budgetsApi.createBudget).not.toHaveBeenCalled()
    })

    it('rejects a second budget for the same category, month and currency', async () => {
      const { user, dialog } = await openNew()

      await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Supermercado')
      await user.type(within(dialog).getByLabelText('Monto'), '100')
      await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'Ya hay un presupuesto en pesos para «Supermercado» en octubre 2026.',
      )
      expect(within(dialog).getByLabelText('Monto')).toHaveValue('100')
    })

    it('shows other save errors as they come', async () => {
      const { user, dialog } = await openNew()
      fakeDb.budgetsApi.createBudget.mockRejectedValueOnce(
        new BudgetError('La categoría elegida ya no existe. Elegí otra.', 'category'),
      )

      await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Farmacia')
      await user.type(within(dialog).getByLabelText('Monto'), '100')
      await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'La categoría elegida ya no existe. Elegí otra.',
      )
    })

    it('offers to create the first one in an empty month', async () => {
      renderWithQuery(<BudgetsPage />, { route: '/presupuestos?mes=2026-03' })
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Crear el primero' }))

      expect(await screen.findByRole('dialog', { name: 'Nuevo presupuesto' })).toHaveTextContent(
        'Para marzo 2026.',
      )
    })

    it('links to Categorías when there are no expense categories', async () => {
      fakeDb.reset({ categories: [{ name: 'Sueldo', kind: 'income' }] })
      const { router } = renderWithQuery(<BudgetsPage />, { route: '/presupuestos' })
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Crear el primero' }))
      const dialog = await screen.findByRole('dialog')
      expect(await within(dialog).findByText(/No tenés categorías de gasto/)).toBeInTheDocument()
      expect(within(dialog).getByRole('button', { name: 'Guardar' })).toBeDisabled()

      await user.click(within(dialog).getByRole('link', { name: 'Crealas en Categorías' }))
      expect(router.state.location.pathname).toBe('/categorias')
    })
  })

  describe('edit', () => {
    async function openEdit(name: string) {
      renderWithQuery(<BudgetsPage />, { route: '/presupuestos?mes=2026-10' })
      const user = userEvent.setup()
      await user.click(await screen.findByRole('button', { name: `Editar presupuesto de ${name}` }))
      const dialog = await screen.findByRole('dialog', { name: 'Editar presupuesto' })
      await within(dialog).findByRole('form', { name: 'Presupuesto' })
      return { user, dialog }
    }

    it('changes only the amount', async () => {
      const { user, dialog } = await openEdit('Supermercado en pesos')

      expect(dialog).toHaveTextContent('Supermercado · en pesos')
      expect(within(dialog).queryByLabelText('Categoría')).not.toBeInTheDocument()
      expect(within(dialog).queryByRole('radio')).not.toBeInTheDocument()
      const amount = within(dialog).getByLabelText('Monto')
      expect(amount).toHaveValue('60000')

      await user.clear(amount)
      await user.type(amount, '40.000')
      await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

      await vi.waitFor(async () =>
        expect(item(await items(), 'Supermercado')).toHaveTextContent('Te pasaste por $ 5.000,00'),
      )
      expect(fakeDb.budgetsApi.updateBudgetAmount).toHaveBeenCalledWith(expect.any(String), {
        amount: 4000000,
        currency: 'ARS',
      })
    })

    it('tells budgets of the same category in each currency apart', async () => {
      const { dialog } = await openEdit('Supermercado en dólares')

      expect(dialog).toHaveTextContent('Supermercado · en dólares')
      expect(within(dialog).getByLabelText('Monto')).toHaveValue('100')
    })

    it('keeps an archived category', async () => {
      const { dialog } = await openEdit('Salidas en pesos')

      expect(dialog).toHaveTextContent('Salidas (archivada) · en pesos')
    })
  })

  describe('delete', () => {
    async function openDelete(name: string) {
      renderWithQuery(<BudgetsPage />, { route: '/presupuestos?mes=2026-10' })
      const user = userEvent.setup()
      await user.click(
        await screen.findByRole('button', { name: `Eliminar presupuesto de ${name}` }),
      )
      return { user, dialog: await screen.findByRole('alertdialog') }
    }

    it('asks for confirmation showing what will be deleted, and deletes it', async () => {
      const { user, dialog } = await openDelete('Transporte en pesos')

      expect(dialog).toHaveTextContent('Transporte · $ 20.000,00 · octubre 2026.')
      await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

      expect(await screen.findByText('Presupuesto eliminado')).toBeInTheDocument()
      await vi.waitFor(async () => expect(await items()).toHaveLength(2))
      expect(fakeDb.movements()).toHaveLength(seed.movements?.length ?? 0)
    })

    it('keeps the budget when cancelling', async () => {
      const { user, dialog } = await openDelete('Transporte en pesos')

      await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(await items()).toHaveLength(3)
    })

    it('shows the error inside the dialog when deleting fails', async () => {
      const { user, dialog } = await openDelete('Transporte en pesos')
      fakeDb.budgetsApi.deleteBudget.mockRejectedValueOnce(
        new BudgetError('No se pudo eliminar el presupuesto. Probá de nuevo.'),
      )

      await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'No se pudo eliminar el presupuesto. Probá de nuevo.',
      )
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })
  })
})
