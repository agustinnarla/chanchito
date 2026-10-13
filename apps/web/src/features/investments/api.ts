import type { CryptoPurchase, CryptoPurchaseInput, Currency } from '@chanchito/core'
import { supabase } from '@/lib/supabase'
import { InvestmentError, toPurchaseSaveError } from './errors'

const COLUMNS = 'id, quantity, cost, cost_currency, platform, occurred_on'

type PurchaseRow = {
  id: string
  quantity: number
  cost: number
  cost_currency: Currency
  platform: string
  occurred_on: string
}

const toPurchase = (row: PurchaseRow): CryptoPurchase => ({
  id: row.id,
  quantity: row.quantity,
  cost: { amount: row.cost, currency: row.cost_currency },
  platform: row.platform,
  occurredOn: row.occurred_on,
})

const toRow = (input: CryptoPurchaseInput) => ({
  quantity: input.quantity,
  cost: input.cost.amount,
  platform: input.platform,
  occurred_on: input.occurredOn,
})

/** Every bitcoin purchase, newest first. */
export async function listPurchases(): Promise<CryptoPurchase[]> {
  const { data, error } = await supabase
    .from('crypto_purchases')
    .select(COLUMNS)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw new InvestmentError('No se pudieron cargar tus compras de bitcoin.')
  return data.map(toPurchase)
}

/** Stores a purchase from `parsePurchaseForm`, already validated; paid in its currency. */
export async function createPurchase(input: CryptoPurchaseInput): Promise<CryptoPurchase> {
  const { data, error } = await supabase
    .from('crypto_purchases')
    .insert({ ...toRow(input), cost_currency: input.cost.currency })
    .select(COLUMNS)
    .single()
  if (error) throw toPurchaseSaveError(error)
  return toPurchase(data)
}

/** Quantity, cost, platform and date can change; the currency it was paid in can't. */
export async function updatePurchase(
  id: string,
  input: CryptoPurchaseInput,
): Promise<CryptoPurchase> {
  const { data, error } = await supabase
    .from('crypto_purchases')
    .update(toRow(input))
    .eq('id', id)
    .select(COLUMNS)
    .single()
  if (error) throw toPurchaseSaveError(error)
  return toPurchase(data)
}

export async function deletePurchase(id: string): Promise<void> {
  const { error } = await supabase.from('crypto_purchases').delete().eq('id', id)
  if (error) throw new InvestmentError('No se pudo eliminar la compra. Probá de nuevo.')
}
