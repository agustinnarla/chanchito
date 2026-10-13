import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchMepRate, MEP_URL, readStoredRate, useMepRate } from './exchange-rate'

const answer = (body: unknown, ok = true) =>
  vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => body }))

const mep = {
  moneda: 'USD',
  casa: 'bolsa',
  nombre: 'Bolsa',
  compra: 1535.9,
  venta: 1542.9,
  fechaActualizacion: '2026-10-12T20:56:00.000Z',
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchMepRate', () => {
  it("reads the MEP's selling price in cents, with its time", async () => {
    const fetchMock = answer(mep)
    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchMepRate()).toEqual({
      from: 'USD',
      to: 'ARS',
      rate: 154290,
      at: '2026-10-12T20:56:00.000Z',
      source: 'MEP',
    })
    expect(fetchMock).toHaveBeenCalledWith(MEP_URL)
  })

  it.each([
    ['another dollar', { ...mep, casa: 'blue' }],
    ['a missing price', { ...mep, venta: undefined }],
    ['a negative price', { ...mep, venta: -1 }],
    ['a price too large to be exact', { ...mep, venta: 1e20 }],
  ])('rejects %s', async (_, body) => {
    vi.stubGlobal('fetch', answer(body))
    await expect(fetchMepRate()).rejects.toThrow()
  })

  it('rejects an error answer', async () => {
    vi.stubGlobal('fetch', answer(mep, false))
    await expect(fetchMepRate()).rejects.toThrow('DolarApi answered 500')
  })
})

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useMepRate', () => {
  it('fetches the rate and stores it for next time', async () => {
    vi.stubGlobal('fetch', answer(mep))
    const { result } = renderHook(() => useMepRate(), { wrapper })

    await waitFor(() => expect(result.current.rate?.rate).toBe(154290))
    expect(result.current.isStale).toBe(false)
    expect(readStoredRate()?.rate).toBe(154290)
  })

  it('keeps the stored rate, marked as stale, when DolarApi fails', async () => {
    localStorage.setItem(
      'chanchito:mep',
      JSON.stringify({ rate: 150000, at: '2026-10-11T18:00:00.000Z' }),
    )
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline'))),
    )
    const { result } = renderHook(() => useMepRate(), { wrapper })

    expect(result.current.rate?.rate).toBe(150000)
    await waitFor(() => expect(result.current.isStale).toBe(true))
    expect(result.current.rate).toMatchObject({ rate: 150000, at: '2026-10-11T18:00:00.000Z' })
  })

  it('has no rate when there has never been one', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline'))),
    )
    const { result } = renderHook(() => useMepRate(), { wrapper })

    await waitFor(() => expect(result.current.isStale).toBe(true))
    expect(result.current.rate).toBeNull()
  })

  it('ignores a broken stored rate and works with blocked storage', () => {
    localStorage.setItem('chanchito:mep', '{nope')
    expect(readStoredRate()).toBeUndefined()

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readStoredRate()).toBeUndefined()
  })
})
