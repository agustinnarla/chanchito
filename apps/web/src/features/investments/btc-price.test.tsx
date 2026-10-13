import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BINANCE_URL, fetchBtcPrice, readStoredPrice, useBtcPrice } from './btc-price'

const answer = (body: unknown, ok = true) =>
  vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => body }))

const prices = [
  { symbol: 'BTCUSDT', price: '82553.11000000' },
  { symbol: 'BTCARS', price: '132697202.00000000' },
]
const now = () => new Date('2026-10-13T01:40:00.000Z')

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchBtcPrice', () => {
  it('reads bitcoin in pesos and in dollars, in cents, in one request', async () => {
    const fetchMock = answer(prices)
    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchBtcPrice(now)).toEqual({
      ars: { amount: 13269720200, currency: 'ARS' },
      usd: { amount: 8255311, currency: 'USD' },
      at: '2026-10-13T01:40:00.000Z',
    })
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(BINANCE_URL)
    expect(decodeURIComponent(BINANCE_URL)).toContain('symbols=["BTCARS","BTCUSDT"]')
  })

  it.each([
    ['a missing symbol', [prices[0]]],
    ['an invalid price', [prices[0], { symbol: 'BTCARS', price: 'n/a' }]],
    ['something else', { code: -1121, msg: 'Invalid symbol.' }],
  ])('rejects %s', async (_, body) => {
    vi.stubGlobal('fetch', answer(body))
    await expect(fetchBtcPrice(now)).rejects.toThrow()
  })

  it('rejects an error answer', async () => {
    vi.stubGlobal('fetch', answer(prices, false))
    await expect(fetchBtcPrice(now)).rejects.toThrow('Binance answered 500')
  })
})

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useBtcPrice', () => {
  it('fetches the price and stores it for next time', async () => {
    vi.stubGlobal('fetch', answer(prices))
    const { result } = renderHook(() => useBtcPrice(), { wrapper })

    await waitFor(() => expect(result.current.price?.ars.amount).toBe(13269720200))
    expect(result.current.isStale).toBe(false)
    expect(readStoredPrice()?.usd.amount).toBe(8255311)
  })

  it('keeps the stored price, marked as stale, when Binance fails', async () => {
    localStorage.setItem(
      'chanchito:btc-price',
      JSON.stringify({ ars: 13000000000, usd: 8000000, at: '2026-10-12T17:05:00.000Z' }),
    )
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline'))),
    )
    const { result } = renderHook(() => useBtcPrice(), { wrapper })

    expect(result.current.price?.ars.amount).toBe(13000000000)
    await waitFor(() => expect(result.current.isStale).toBe(true))
  })

  it('has no price when there has never been one, and survives broken or blocked storage', async () => {
    localStorage.setItem('chanchito:btc-price', '{nope')
    expect(readStoredPrice()).toBeUndefined()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline'))),
    )
    const { result } = renderHook(() => useBtcPrice(), { wrapper })

    await waitFor(() => expect(result.current.isStale).toBe(true))
    expect(result.current.price).toBeNull()

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readStoredPrice()).toBeUndefined()
  })
})
