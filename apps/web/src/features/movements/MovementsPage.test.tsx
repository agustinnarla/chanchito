import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeDb, type FakeSeed } from '@/test/fake-db'
import { renderWithQuery } from '@/test/render-with-query'
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
})
