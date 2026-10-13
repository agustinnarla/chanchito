import { decimalToCents, type Money } from '@chanchito/core'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

/** Public, no keys (spec 010): bitcoin in pesos, and in dollars for reference. One request. */
export const BINANCE_URL =
  'https://api.binance.com/api/v3/ticker/price?symbols=%5B%22BTCARS%22%2C%22BTCUSDT%22%5D'

const STORAGE_KEY = 'chanchito:btc-price'
const EVERY_MINUTE = 60 * 1000

/** One bitcoin in pesos and in dollars (USDT taken as dollars), and when it was fetched. */
export type BtcPrice = { ars: Money; usd: Money; at: string }

const ResponseSchema = z.array(z.object({ symbol: z.string(), price: z.string() }))
const StoredSchema = z.object({
  ars: z.int().positive(),
  usd: z.int().positive(),
  at: z.iso.datetime(),
})

function priceOf(prices: z.infer<typeof ResponseSchema>, symbol: string): number {
  const found = prices.find((p) => p.symbol === symbol)
  if (!found) throw new Error(`Binance did not answer ${symbol}`)
  return decimalToCents(found.price)
}

const toPrice = (ars: number, usd: number, at: string): BtcPrice => ({
  ars: { amount: ars, currency: 'ARS' },
  usd: { amount: usd, currency: 'USD' },
  at,
})

/** Today's bitcoin price. Throws when Binance fails or answers something odd. */
export async function fetchBtcPrice(now: () => Date = () => new Date()): Promise<BtcPrice> {
  const response = await fetch(BINANCE_URL)
  if (!response.ok) throw new Error(`Binance answered ${response.status}`)
  const prices = ResponseSchema.parse(await response.json())
  return toPrice(priceOf(prices, 'BTCARS'), priceOf(prices, 'BTCUSDT'), now().toISOString())
}

/** The last price that worked, if storage has a valid one. Storage can be blocked: then none. */
export function readStoredPrice(): BtcPrice | undefined {
  try {
    const stored = StoredSchema.safeParse(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'))
    return stored.success ? toPrice(stored.data.ars, stored.data.usd, stored.data.at) : undefined
  } catch {
    return undefined
  }
}

function storePrice({ ars, usd, at }: BtcPrice): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ars: ars.amount, usd: usd.amount, at }))
  } catch {
    // Blocked storage: the price lasts until the page reloads.
  }
}

/**
 * Bitcoin's price, refreshed every minute while the screen is open. Shows the last stored one at
 * once; when Binance fails, keeps it (`isStale`). `price` is null only when there's never been one.
 */
export function useBtcPrice() {
  const query = useQuery({
    queryKey: ['btc-price'],
    queryFn: async () => {
      const price = await fetchBtcPrice()
      storePrice(price)
      return price
    },
    initialData: readStoredPrice,
    // The stored one counts as old, so it refreshes right away.
    initialDataUpdatedAt: 0,
    staleTime: EVERY_MINUTE,
    refetchInterval: EVERY_MINUTE,
    retry: 1,
  })
  return { price: query.data ?? null, isStale: query.isError }
}
