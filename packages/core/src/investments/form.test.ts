import { describe, expect, it } from 'vitest'
import { parsePurchaseForm } from './form'

const today = '2026-10-15'
const valid = {
  quantity: '0,0035',
  cost: '490.000',
  occurredOn: '2026-10-12',
  platform: ' Binance  P2P ',
}

describe('parsePurchaseForm', () => {
  it('parses the purchase, in pesos, with the platform normalized', () => {
    expect(parsePurchaseForm(valid, today)).toEqual({
      ok: true,
      data: {
        quantity: 350000,
        cost: { amount: 49000000, currency: 'ARS' },
        occurredOn: '2026-10-12',
        platform: 'Binance P2P',
      },
    })
  })

  it('accepts a purchase made today', () => {
    expect(parsePurchaseForm({ ...valid, occurredOn: today }, today).ok).toBe(true)
  })

  it('gives every invalid field its message', () => {
    expect(
      parsePurchaseForm(
        { quantity: '0', cost: '', occurredOn: '2026-10-16', platform: '  ' },
        today,
      ),
    ).toEqual({
      ok: false,
      errors: {
        quantity: 'La cantidad tiene que ser mayor a 0.',
        cost: 'Ingresá un monto.',
        occurredOn: 'La fecha no puede ser futura.',
        platform: 'Ingresá la plataforma.',
      },
    })
  })

  it('rejects an invalid date and a platform longer than 30 characters', () => {
    expect(
      parsePurchaseForm({ ...valid, occurredOn: '2026-02-30', platform: 'a'.repeat(31) }, today),
    ).toEqual({
      ok: false,
      errors: {
        occurredOn: 'Ingresá una fecha válida.',
        platform: 'La plataforma puede tener hasta 30 caracteres.',
      },
    })
  })
})
