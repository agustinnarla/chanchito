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
vi.mock('@/features/savings/api', async () => (await import('@/test/fake-db')).fakeDb.savingsApi)
vi.mock('@/features/budgets/api', async () => (await import('@/test/fake-db')).fakeDb.budgetsApi)

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
    ...(byTerm.Estado ? { Estado: byTerm.Estado } : {}),
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
      Estado: 'Vas bien',
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
      Estado: 'Vas bien',
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

    expect(
      await screen.findByText('Arranquemos marzo: todavía no cargaste nada.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Moneda' })).not.toBeInTheDocument()
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
    await user.click(await within(dialog).findByRole('radio', { name: 'Supermercado' }))
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

  describe('mood (spec 008)', () => {
    const mood = () => screen.getByRole('region', { name: 'Cómo viene el mes' })

    it('greets for the time of day and says how the month is going', async () => {
      renderWithQuery(<HomePage />)

      expect((await figures()).Estado).toBe('Vas bien')
      expect(mood()).toHaveTextContent('Buenas tardes')
      expect(mood()).toHaveTextContent('¡Vas bárbaro! Este mes te sobran $ 2.000.')
    })

    it('names the budget that went over and shows it first among the budgets', async () => {
      fakeDb.reset({
        categories: [
          ...(seed.categories ?? []),
          { name: 'Salidas', kind: 'expense', emoji: 'clinking_beer_mugs' },
          { name: 'Transporte', kind: 'expense', emoji: 'bus' },
          { name: 'Farmacia', kind: 'expense', emoji: 'pill' },
        ],
        movements: [
          ...(seed.movements ?? []),
          { category: 'Salidas', amount: 8500, occurredOn: '2026-10-03' },
          { category: 'Transporte', amount: 1000, occurredOn: '2026-10-04' },
        ],
        budgets: [
          { category: 'Transporte', amount: 10000, month: '2026-10' }, // 10%
          { category: 'Salidas', amount: 10000, month: '2026-10' }, // 85%
          { category: 'Supermercado', amount: 50000, month: '2026-10' }, // 200%
          { category: 'Farmacia', amount: 10000, month: '2026-10' }, // 0%
        ],
      })
      renderWithQuery(<HomePage />)

      expect((await figures()).Estado).toBe('Te pasaste')
      expect(mood()).toHaveTextContent(
        'Te pasaste en Supermercado. Tranqui, todavía queda mes para acomodarlo.',
      )
      const glance = await screen.findByRole('list', {
        name: 'Presupuestos que más atención necesitan',
      })
      const names = within(glance)
        .getAllByRole('listitem')
        .map((li) => li.querySelector('.truncate')?.textContent)
      expect(names).toEqual(['Supermercado', 'Salidas', 'Transporte'])
      expect(screen.getByRole('link', { name: 'Ver todos los presupuestos' })).toHaveAttribute(
        'href',
        '/presupuestos?mes=2026-10',
      )
    })

    it('says when more went out than came in', async () => {
      fakeDb.reset({
        ...seed,
        movements: [{ category: 'Supermercado', amount: 5000, occurredOn: '2026-10-02' }],
      })
      renderWithQuery(<HomePage />)

      expect((await figures()).Estado).toBe('Te pasaste')
      expect(mood()).toHaveTextContent('Este mes salió más de lo que entró.')
    })

    it('stays neutral in a currency without movements', async () => {
      fakeDb.reset({
        ...seed,
        movements: [{ category: 'Sueldo', amount: 300000, occurredOn: '2026-10-01' }],
      })
      renderWithQuery(<HomePage />)
      const user = userEvent.setup()
      await figures()

      await user.click(screen.getByRole('radio', { name: 'USD' }))

      expect(mood()).toHaveTextContent('Este mes no hay movimientos en dólares.')
      expect((await figures()).Estado).toBeUndefined()
    })

    it('counts what was saved this month (spec 009)', async () => {
      fakeDb.reset({
        ...seed,
        goals: [{ name: 'Celular nuevo' }],
        contributions: [{ goal: 'Celular nuevo', amount: 80000, occurredOn: '2026-10-10' }],
      })
      renderWithQuery(<HomePage />)

      await vi.waitFor(() =>
        expect(mood()).toHaveTextContent('¡Vas bárbaro! Ahorraste $ 800 y te sobran $ 1.200.'),
      )
      const saved = screen.getByText('Ahorraste', { selector: 'dt' })
      expect(saved.nextElementSibling).toHaveTextContent('$ 800,00')
    })

    it('does not show budgets when the month has none', async () => {
      renderWithQuery(<HomePage />)
      await figures()

      expect(screen.queryByRole('heading', { name: 'Tus presupuestos' })).not.toBeInTheDocument()
    })
  })
})
