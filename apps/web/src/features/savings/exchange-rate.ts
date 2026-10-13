import { decimalToCents, type ExchangeRate } from '@chanchito/core'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

/** Public and free, no keys (spec 009). The "bolsa" dollar is the MEP. */
export const MEP_URL = 'https://dolarapi.com/v1/dolares/bolsa'

const STORAGE_KEY = 'chanchito:mep'
const FRESH_FOR = 30 * 60 * 1000

const ResponseSchema = z.object({
  casa: z.literal('bolsa'),
  venta: z.number().positive(),
  fechaActualizacion: z.iso.datetime(),
})

const StoredSchema = z.object({ rate: z.int().positive(), at: z.iso.datetime() })

/** Today's MEP dollar, selling price. Throws when the service fails or answers something odd. */
export async function fetchMepRate(): Promise<ExchangeRate> {
  const response = await fetch(MEP_URL)
  if (!response.ok) throw new Error(`DolarApi answered ${response.status}`)
  const { venta, fechaActualizacion } = ResponseSchema.parse(await response.json())
  // The number goes to text before cents, so no float arithmetic touches it.
  return toRate(decimalToCents(String(venta)), fechaActualizacion)
}

const toRate = (rate: number, at: string): ExchangeRate => ({
  from: 'USD',
  to: 'ARS',
  rate,
  at,
  source: 'MEP',
})

/** The last rate that worked, if storage has a valid one. Storage can be blocked: then none. */
export function readStoredRate(): ExchangeRate | undefined {
  try {
    const stored = StoredSchema.safeParse(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'))
    return stored.success ? toRate(stored.data.rate, stored.data.at) : undefined
  } catch {
    return undefined
  }
}

function storeRate({ rate, at }: ExchangeRate): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rate, at }))
  } catch {
    // Blocked storage: the rate lasts until the page reloads.
  }
}

/**
 * Today's MEP dollar. Shows the last stored one at once and refreshes it; when DolarApi fails,
 * keeps the stored one (`isStale`). `rate` is null only when there has never been one.
 */
export function useMepRate() {
  const query = useQuery({
    queryKey: ['exchange-rate', 'MEP'],
    queryFn: async () => {
      const rate = await fetchMepRate()
      storeRate(rate)
      return rate
    },
    initialData: readStoredRate,
    // The stored one counts as old, so it refreshes right away.
    initialDataUpdatedAt: 0,
    staleTime: FRESH_FOR,
    retry: 1,
  })
  return {
    rate: query.data ?? null,
    isStale: query.isError,
    isPending: query.isFetching && !query.data,
  }
}
