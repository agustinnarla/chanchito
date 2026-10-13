import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SavingsPage } from '@/features/savings/SavingsPage'
import { fakeDb, type FakeSeed } from '@/test/fake-db'
import { stubPublicApis } from '@/test/public-apis'
import { renderWithQuery } from '@/test/render-with-query'

vi.mock('@/features/savings/api', async () => (await import('@/test/fake-db')).fakeDb.savingsApi)
vi.mock(
  '@/features/investments/api',
  async () => (await import('@/test/fake-db')).fakeDb.investmentsApi,
)

const seed: FakeSeed = {
  purchases: [
    { quantity: 400000, cost: 26000000, occurredOn: '2025-03-10' },
    { quantity: 500000, cost: 41000000, occurredOn: '2025-11-02' },
    { quantity: 350000, cost: 49000000, occurredOn: '2026-06-18' },
  ],
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 15, 12, 0))
  localStorage.clear()
  stubPublicApis()
  fakeDb.reset(seed)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const panel = () => screen.getByRole('region', { name: 'Inversiones' })

describe('Investments', () => {
  it("shows what's held, what it cost and what it's worth at Binance's price", async () => {
    renderWithQuery(<SavingsPage />)

    await vi.waitFor(() => expect(panel()).toHaveTextContent('$ 1.658.715,03'))
    expect(panel()).toHaveTextContent('0,0125 BTC · en Binance')
    expect(panel()).toHaveTextContent('Pusiste$ 1.160.000,00')
    expect(panel()).toHaveTextContent('≈ US$ 1.031,91')
    expect(panel()).toHaveTextContent('+$ 498.715,03 · +43%')
    expect(panel()).toHaveTextContent(
      '1 BTC = $ 132.697.202,00 (US$ 82.553,11) · Binance, actualizado hoy a las 12:00',
    )
    expect(panel()).toHaveTextContent('Precio promedio de compra $ 92.800.000,00')
    expect(panel()).toHaveAttribute('data-tone', 'good')
    expect(screen.getByText('Invertido, valor de hoy').nextElementSibling).toHaveTextContent(
      '$ 1.658.715,03',
    )
  })

  it('tints a loss and says it with its sign', async () => {
    stubPublicApis({ btc: { ars: '50000000.00', usd: '31000.00' } })
    renderWithQuery(<SavingsPage />)

    await vi.waitFor(() => expect(panel()).toHaveAttribute('data-tone', 'bad'))
    expect(panel()).toHaveTextContent('-$ 535.000,00 · -46%')
  })

  it('keeps the last price when Binance fails, and says so', async () => {
    localStorage.setItem(
      'chanchito:btc-price',
      JSON.stringify({ ars: 13000000000, usd: 8000000, at: '2026-10-14T20:05:00.000Z' }),
    )
    stubPublicApis({ btc: null })
    renderWithQuery(<SavingsPage />)

    // The hook retries once before keeping the stored price
    expect(
      await screen.findByText(/último precio de Binance, ayer a las 17:05/, {}, { timeout: 3000 }),
    ).toBeInTheDocument()
    expect(panel()).toHaveTextContent('$ 1.625.000,00')
  })

  it('shows the quantity and what was invested without any price', async () => {
    stubPublicApis({ btc: null })
    renderWithQuery(<SavingsPage />)

    expect(await screen.findByText('No pudimos traer el precio de Binance.')).toBeInTheDocument()
    expect(panel()).toHaveTextContent('Vale hoy—')
    expect(panel()).toHaveAttribute('data-tone', 'neutral')
    expect(screen.queryByText('Invertido, valor de hoy')).not.toBeInTheDocument()
  })

  it('loads a purchase, previewing its price and the new average', async () => {
    renderWithQuery(<SavingsPage />)
    const user = userEvent.setup()

    await user.click(
      await within(await screen.findByRole('region', { name: 'Inversiones' })).findByRole(
        'button',
        { name: 'Nueva compra' },
      ),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Nueva compra' })
    expect(within(dialog).getByLabelText('Plataforma')).toHaveValue('Binance')
    await user.type(within(dialog).getByLabelText('Bitcoin comprado (BTC)'), '0,001')
    await user.type(within(dialog).getByLabelText('Pagaste ($)'), '132.000')

    expect(dialog).toHaveTextContent('Precio de esta compra$ 132.000.000,00 por BTC')
    expect(dialog).toHaveTextContent('Vas a tener0,0135 BTC')
    expect(dialog).toHaveTextContent('Nuevo precio promedio$ 95.703.703,70')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    await vi.waitFor(() => expect(panel()).toHaveTextContent('0,0135 BTC'))
    expect(fakeDb.purchases().at(-1)).toMatchObject({
      quantity: 100000,
      cost: { amount: 13200000, currency: 'ARS' },
      occurredOn: '2026-10-15',
    })
  })

  it('rejects a purchase in the future', async () => {
    renderWithQuery(<SavingsPage />)
    const user = userEvent.setup()

    await user.click(
      await within(await screen.findByRole('region', { name: 'Inversiones' })).findByRole(
        'button',
        { name: 'Nueva compra' },
      ),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Nueva compra' })
    await user.type(within(dialog).getByLabelText('Bitcoin comprado (BTC)'), '0,001')
    await user.type(within(dialog).getByLabelText('Pagaste ($)'), '132.000')
    await user.clear(within(dialog).getByLabelText('Fecha'))
    await user.type(within(dialog).getByLabelText('Fecha'), '2026-10-16')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    expect(within(dialog).getByText('La fecha no puede ser futura.')).toBeInTheDocument()
    expect(fakeDb.purchases()).toHaveLength(3)
  })

  it('lists the purchases, newest first, and edits and deletes one', async () => {
    renderWithQuery(<SavingsPage />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Compras (3)' }))
    const list = screen.getByRole('list', { name: 'Compras de bitcoin' })
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual([
      '18/06/20260,0035 BTC a $ 140.000.000,00$ 490.000,00',
      '02/11/20250,005 BTC a $ 82.000.000,00$ 410.000,00',
      '10/03/20250,004 BTC a $ 65.000.000,00$ 260.000,00',
    ])

    await user.click(
      within(list).getByRole('button', { name: 'Acciones de la compra del 18/06/2026' }),
    )
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar compra' })
    expect(within(dialog).getByLabelText('Bitcoin comprado (BTC)')).toHaveValue('0,0035')
    await user.clear(within(dialog).getByLabelText('Plataforma'))
    await user.type(within(dialog).getByLabelText('Plataforma'), 'Binance P2P')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))
    await vi.waitFor(() => expect(fakeDb.purchases()[2]?.platform).toBe('Binance P2P'))
    expect(panel()).toHaveTextContent('0,0125 BTC')
    expect(panel()).not.toHaveTextContent('· en Binance')

    await user.click(
      within(list).getByRole('button', { name: 'Acciones de la compra del 10/03/2025' }),
    )
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }))
    const confirm = await screen.findByRole('alertdialog', { name: '¿Eliminar esta compra?' })
    expect(confirm).toHaveTextContent('0,004 BTC por $ 260.000,00 · 10/03/2025.')
    await user.click(within(confirm).getByRole('button', { name: 'Eliminar' }))

    await vi.waitFor(() => expect(panel()).toHaveTextContent('0,0085 BTC'))
  })

  it('invites to load the first purchase', async () => {
    fakeDb.reset()
    renderWithQuery(<SavingsPage />)
    const user = userEvent.setup()

    expect(await screen.findByText('Todavía no cargaste ninguna inversión.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cargar una compra' }))
    expect(await screen.findByRole('dialog', { name: 'Nueva compra' })).toBeInTheDocument()
  })

  it('offers to retry when the purchases fail to load', async () => {
    fakeDb.investmentsApi.listPurchases.mockRejectedValueOnce(new Error('offline'))
    renderWithQuery(<SavingsPage />)
    const user = userEvent.setup()

    expect(await within(panel()).findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar tus compras de bitcoin.',
    )
    await user.click(within(panel()).getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('button', { name: 'Compras (3)' })).toBeInTheDocument()
  })
})
