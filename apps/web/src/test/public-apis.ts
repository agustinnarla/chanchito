import { vi } from 'vitest'
import { BINANCE_URL } from '@/features/investments/btc-price'
import { MEP_URL } from '@/features/savings/exchange-rate'

type Answers = {
  /** The MEP dollar's selling price; null makes DolarApi fail. */
  mep?: number | null
  /** One bitcoin in pesos and in dollars, as Binance writes them; null makes Binance fail. */
  btc?: { ars: string; usd: string } | null
}

/**
 * A stand-in for `fetch` that answers like DolarApi and Binance (specs 009 and 010), so screens
 * get exchange rates and prices without the network. Unknown URLs fail.
 */
export function stubPublicApis({
  mep = 1450,
  btc = { ars: '132697202.00', usd: '82553.11' },
}: Answers = {}) {
  const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body })
  const fetchMock = vi.fn(async (url: string) => {
    if (url === MEP_URL && mep !== null) {
      return ok({
        casa: 'bolsa',
        compra: mep - 7,
        venta: mep,
        fechaActualizacion: '2026-10-15T14:20:00.000Z',
      })
    }
    if (url === BINANCE_URL && btc !== null) {
      return ok([
        { symbol: 'BTCUSDT', price: btc.usd },
        { symbol: 'BTCARS', price: btc.ars },
      ])
    }
    throw new Error(`offline: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
