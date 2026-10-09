import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeDb, type FakeSeed } from '@/test/fake-db'
import { renderWithQuery } from '@/test/render-with-query'
import { MovementError } from './errors'
import { MovementsPage } from './MovementsPage'
import { NewMovementButton } from './NewMovementButton'

vi.mock(
  '@/features/categories/api',
  async () => (await import('@/test/fake-db')).fakeDb.categoriesApi,
)
vi.mock('./api', async () => (await import('@/test/fake-db')).fakeDb.movementsApi)

const seed: FakeSeed = {
  categories: [
    { name: 'Supermercado', kind: 'expense' },
    { name: 'Salidas', kind: 'expense', archived: true },
    { name: 'Sueldo', kind: 'income' },
  ],
  movements: [
    { category: 'Supermercado', amount: 123456, occurredOn: '2026-10-07', description: 'Coto' },
    { category: 'Sueldo', amount: 10000, currency: 'USD', occurredOn: '2026-10-01' },
    { category: 'Salidas', amount: 500, occurredOn: '2026-10-31' },
    { category: 'Supermercado', amount: 999, occurredOn: '2026-09-30' },
    { category: 'Supermercado', amount: 777, occurredOn: '2026-11-01' },
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

function rows(month = 'octubre 2026') {
  return within(screen.getByRole('list', { name: `Movimientos de ${month}` })).getAllByRole(
    'listitem',
  )
}

describe('MovementsPage', () => {
  it('shows the current month by default', async () => {
    renderWithQuery(<MovementsPage />, { route: '/movimientos' })

    expect(screen.getByRole('heading', { name: 'Octubre 2026' })).toBeInTheDocument()
    expect(
      await screen.findByRole('list', { name: 'Movimientos de octubre 2026' }),
    ).toBeInTheDocument()
  })

  it('lists only that month, newest first, with signed amounts', async () => {
    renderWithQuery(<MovementsPage />, { route: '/movimientos?mes=2026-10' })

    await screen.findByRole('list', { name: 'Movimientos de octubre 2026' })
    const items = rows()
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Salidas(archivada)31/10/2026-$ 5,00')
    expect(items[1]).toHaveTextContent('Supermercado07/10/2026 · Coto-$ 1.234,56')
    expect(items[2]).toHaveTextContent('Sueldo01/10/2026+US$ 100,00')
  })

  it('moves between months and keeps the month in the URL', async () => {
    const { router } = renderWithQuery(<MovementsPage />, { route: '/movimientos?mes=2026-10' })
    const user = userEvent.setup()
    await screen.findByRole('list', { name: 'Movimientos de octubre 2026' })

    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }))

    expect(screen.getByRole('heading', { name: 'Noviembre 2026' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?mes=2026-11')
    expect(
      await screen.findByRole('list', { name: 'Movimientos de noviembre 2026' }),
    ).toHaveTextContent('-$ 7,77')

    await user.click(screen.getByRole('button', { name: 'Mes anterior' }))
    await user.click(screen.getByRole('button', { name: 'Mes anterior' }))

    expect(router.state.location.search).toBe('?mes=2026-09')
    expect(
      await screen.findByRole('list', { name: 'Movimientos de septiembre 2026' }),
    ).toHaveTextContent('-$ 9,99')
  })

  it('crosses years', async () => {
    const { router } = renderWithQuery(<MovementsPage />, { route: '/movimientos?mes=2026-01' })
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Mes anterior' }))

    expect(screen.getByRole('heading', { name: 'Diciembre 2025' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?mes=2025-12')
  })

  it('says when a month has no movements', async () => {
    renderWithQuery(<MovementsPage />, { route: '/movimientos?mes=2026-03' })

    expect(await screen.findByText('No hay movimientos en marzo 2026.')).toBeInTheDocument()
  })

  it.each(['2026-13', 'hola'])('shows the current month for an invalid ?mes=%s', async (mes) => {
    renderWithQuery(<MovementsPage />, { route: `/movimientos?mes=${mes}` })

    expect(screen.getByRole('heading', { name: 'Octubre 2026' })).toBeInTheDocument()
  })

  it('shows a movement right after saving it from the dialog', async () => {
    renderWithQuery(
      <>
        <NewMovementButton />
        <MovementsPage />
      </>,
      { route: '/movimientos?mes=2026-10' },
    )
    const user = userEvent.setup()
    await screen.findByRole('list', { name: 'Movimientos de octubre 2026' })

    await user.click(screen.getByRole('button', { name: 'Nuevo movimiento' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(await within(dialog).findByRole('radio', { name: 'Ingreso' }))
    await user.type(within(dialog).getByLabelText('Monto'), '50')
    await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Sueldo')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('+$ 50,00')).toBeInTheDocument()
    expect(rows()).toHaveLength(4)
  })

  it('shows an error when movements cannot be loaded and retries', async () => {
    fakeDb.movementsApi.listMovements.mockRejectedValueOnce(new Error('offline'))
    renderWithQuery(<MovementsPage />, { route: '/movimientos?mes=2026-10' })
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar los movimientos.',
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(
      await screen.findByRole('list', { name: 'Movimientos de octubre 2026' }),
    ).toBeInTheDocument()
  })

  describe('edit', () => {
    async function openEdit(name: string) {
      renderWithQuery(<MovementsPage />, { route: '/movimientos?mes=2026-10' })
      const user = userEvent.setup()
      await user.click(await screen.findByRole('button', { name: `Editar movimiento de ${name}` }))
      const dialog = await screen.findByRole('dialog', { name: 'Editar movimiento' })
      await within(dialog).findByLabelText('Monto')
      return { user, dialog }
    }

    it('opens the dialog with the movement data', async () => {
      const { dialog } = await openEdit('Supermercado del 07/10/2026')

      expect(within(dialog).getByRole('radio', { name: 'Gasto' })).toBeChecked()
      expect(within(dialog).getByLabelText('Monto')).toHaveValue('1234,56')
      expect(within(dialog).getByRole('radio', { name: 'ARS' })).toBeChecked()
      expect(within(dialog).getByLabelText('Fecha')).toHaveValue('2026-10-07')
      expect(within(dialog).getByLabelText('Categoría')).toHaveDisplayValue('Supermercado')
      expect(within(dialog).getByLabelText('Descripción (opcional)')).toHaveValue('Coto')
    })

    it('saves the changes and updates the list', async () => {
      const { user, dialog } = await openEdit('Supermercado del 07/10/2026')

      const amount = within(dialog).getByLabelText('Monto')
      await user.clear(amount)
      await user.type(amount, '2.000')
      await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

      expect(await screen.findByText('-$ 2.000,00')).toBeInTheDocument()
      expect(screen.queryByText('-$ 1.234,56')).not.toBeInTheDocument()
    })

    it('removes the movement from the month when its date moves to another month', async () => {
      const { user, dialog } = await openEdit('Supermercado del 07/10/2026')

      const date = within(dialog).getByLabelText('Fecha')
      await user.clear(date)
      await user.type(date, '2026-11-02')
      await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

      await waitFor(() => expect(rows()).toHaveLength(2))
      expect(screen.queryByText('-$ 1.234,56')).not.toBeInTheDocument()
    })

    it('keeps an archived category available for its own movement', async () => {
      const { user, dialog } = await openEdit('Salidas del 31/10/2026')

      expect(within(dialog).getByLabelText('Categoría')).toHaveDisplayValue('Salidas (archivada)')

      await user.type(within(dialog).getByLabelText('Descripción (opcional)'), 'Cine')
      await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

      await waitFor(() => expect(rows()[0]).toHaveTextContent('31/10/2026 · Cine'))
    })
  })

  describe('delete', () => {
    async function openDelete(name: string) {
      renderWithQuery(<MovementsPage />, { route: '/movimientos?mes=2026-10' })
      const user = userEvent.setup()
      await user.click(
        await screen.findByRole('button', { name: `Eliminar movimiento de ${name}` }),
      )
      const dialog = await screen.findByRole('alertdialog', { name: '¿Eliminar este movimiento?' })
      return { user, dialog }
    }

    it('asks for confirmation showing what will be deleted, and deletes it', async () => {
      const { user, dialog } = await openDelete('Supermercado del 07/10/2026')

      expect(dialog).toHaveTextContent('Supermercado · 07/10/2026 · -$ 1.234,56')

      await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

      expect(await screen.findByText('Movimiento eliminado')).toBeInTheDocument()
      await waitFor(() => expect(rows()).toHaveLength(2))
    })

    it('keeps the movement when cancelling', async () => {
      const { user, dialog } = await openDelete('Supermercado del 07/10/2026')

      await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
      expect(rows()).toHaveLength(3)
      expect(fakeDb.movementsApi.deleteMovement).not.toHaveBeenCalled()
    })

    it('shows the error inside the dialog when deleting fails', async () => {
      fakeDb.movementsApi.deleteMovement.mockRejectedValueOnce(
        new MovementError('No se pudo eliminar el movimiento. Probá de nuevo.'),
      )
      const { user, dialog } = await openDelete('Supermercado del 07/10/2026')

      await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'No se pudo eliminar el movimiento.',
      )
      expect(fakeDb.movements()).toHaveLength(5)
    })
  })

  describe('filters', () => {
    function filters() {
      const group = screen.getByRole('group', { name: 'Filtros' })
      return {
        kind: within(group).getByLabelText('Tipo'),
        category: within(group).getByLabelText('Categoría'),
        currency: within(group).getByLabelText('Moneda'),
        clear: within(group).getByRole('button', { name: 'Limpiar filtros' }),
      }
    }

    async function renderPage(route = '/movimientos?mes=2026-10') {
      const result = renderWithQuery(<MovementsPage />, { route })
      await screen.findByRole('list', { name: 'Movimientos de octubre 2026' })
      // Category options load separately.
      await waitFor(() =>
        expect(within(filters().category).getAllByRole('option').length).toBeGreaterThan(1),
      )
      return { ...result, user: userEvent.setup() }
    }

    const params = (search: string) => Object.fromEntries(new URLSearchParams(search))

    it('filters by kind and keeps it in the URL with the month', async () => {
      const { user, router } = await renderPage()

      await user.selectOptions(filters().kind, 'Ingresos')

      expect(rows()).toHaveLength(1)
      expect(rows()[0]).toHaveTextContent('Sueldo')
      expect(params(router.state.location.search)).toEqual({ mes: '2026-10', tipo: 'ingreso' })
    })

    it('filters by currency', async () => {
      const { user, router } = await renderPage()

      await user.selectOptions(filters().currency, 'ARS')

      expect(rows()).toHaveLength(2)
      expect(params(router.state.location.search)).toMatchObject({ moneda: 'ARS' })
    })

    it('filters by category, including archived ones', async () => {
      const { user } = await renderPage()

      await user.selectOptions(filters().category, 'Salidas (archivada)')

      expect(rows()).toHaveLength(1)
      expect(rows()[0]).toHaveTextContent('Salidas')
    })

    it('combines filters', async () => {
      const { user } = await renderPage()

      await user.selectOptions(filters().kind, 'Gastos')
      await user.selectOptions(filters().currency, 'ARS')
      await user.selectOptions(filters().category, 'Supermercado')

      expect(rows()).toHaveLength(1)
      expect(rows()[0]).toHaveTextContent('-$ 1.234,56')
    })

    it('only offers categories of the chosen kind and clears one of the other kind', async () => {
      const { user } = await renderPage()

      await user.selectOptions(filters().category, 'Supermercado')
      await user.selectOptions(filters().kind, 'Ingresos')

      expect(filters().category).toHaveValue('')
      expect(
        within(filters().category)
          .getAllByRole('option')
          .map((o) => o.textContent),
      ).toEqual(['Todas', 'Sueldo'])
    })

    it('reads the filters from the URL', async () => {
      await renderPage('/movimientos?mes=2026-10&tipo=gasto&moneda=ARS')

      expect(filters().kind).toHaveDisplayValue('Gastos')
      expect(filters().currency).toHaveDisplayValue('ARS')
      expect(rows()).toHaveLength(2)
    })

    it('ignores an unknown category in the URL', async () => {
      await renderPage('/movimientos?mes=2026-10&categoria=no-existe')

      expect(rows()).toHaveLength(3)
      expect(filters().category).toHaveValue('')
    })

    it('keeps the filters when changing months', async () => {
      const { user, router } = await renderPage('/movimientos?mes=2026-10&moneda=ARS')

      await user.click(screen.getByRole('button', { name: 'Mes siguiente' }))

      expect(params(router.state.location.search)).toEqual({ mes: '2026-11', moneda: 'ARS' })
    })

    it('says when no movement matches and offers to clear the filters', async () => {
      const { router } = renderWithQuery(<MovementsPage />, {
        route: '/movimientos?mes=2026-10&tipo=ingreso&moneda=ARS',
      })
      const user = userEvent.setup()

      expect(
        await screen.findByText('Ningún movimiento de octubre 2026 coincide con los filtros.'),
      ).toBeInTheDocument()

      // Second "Limpiar filtros": the one next to the message (the first is in the filter bar).
      await user.click(screen.getAllByRole('button', { name: 'Limpiar filtros' })[1] as HTMLElement)

      expect(
        await screen.findByRole('list', { name: 'Movimientos de octubre 2026' }),
      ).toBeInTheDocument()
      expect(rows()).toHaveLength(3)
      expect(params(router.state.location.search)).toEqual({ mes: '2026-10' })
    })

    it('disables "Limpiar filtros" when there are no filters', async () => {
      await renderPage()

      expect(filters().clear).toBeDisabled()
    })
  })
})
