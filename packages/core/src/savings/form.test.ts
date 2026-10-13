import { describe, expect, it } from 'vitest'
import { parseContributionForm, parseGoalForm } from './form'

describe('parseGoalForm', () => {
  const valid = {
    name: '  Celular   nuevo ',
    emoji: 'mobile_phone',
    targetAmount: '800',
    targetCurrency: 'USD',
    savingCurrency: 'ARS',
  } as const

  it('normalizes the name and parses the target', () => {
    expect(parseGoalForm(valid)).toEqual({
      ok: true,
      data: {
        name: 'Celular nuevo',
        emoji: 'mobile_phone',
        target: { amount: 80000, currency: 'USD' },
        savingCurrency: 'ARS',
      },
    })
  })

  it('gives every invalid field its message', () => {
    expect(parseGoalForm({ ...valid, name: '  ', targetAmount: '0' })).toEqual({
      ok: false,
      errors: { name: 'Ingresá un nombre.', targetAmount: 'El monto tiene que ser mayor a 0.' },
    })
  })

  it('limits the name to 40 characters', () => {
    const result = parseGoalForm({ ...valid, name: 'a'.repeat(41) })
    expect(result).toEqual({
      ok: false,
      errors: { name: 'El nombre puede tener hasta 40 caracteres.' },
    })
  })

  it('falls back to the default emoji for an unknown key', () => {
    const result = parseGoalForm({ ...valid, emoji: 'not_an_emoji' })
    expect(result.ok && result.data.emoji).toBe('package')
  })
})

describe('parseContributionForm', () => {
  const goal = { id: '3f0f8c1e-2b4a-4d3a-9c1e-1a2b3c4d5e6f', savingCurrency: 'ARS' } as const
  const saved = { amount: 45000000, currency: 'ARS' } as const

  it('makes a deposit positive', () => {
    expect(
      parseContributionForm(
        { amount: '80.000', occurredOn: '2026-10-12' },
        { goal, saved, kind: 'deposit' },
      ),
    ).toEqual({
      ok: true,
      data: {
        goalId: goal.id,
        amount: { amount: 8000000, currency: 'ARS' },
        occurredOn: '2026-10-12',
      },
    })
  })

  it('makes a withdrawal negative', () => {
    const result = parseContributionForm(
      { amount: '100.000', occurredOn: '2026-10-12' },
      { goal, saved, kind: 'withdrawal' },
    )
    expect(result.ok && result.data.amount.amount).toBe(-10000000)
  })

  it('does not let a withdrawal take out more than what was saved', () => {
    expect(
      parseContributionForm(
        { amount: '450.000,01', occurredOn: '2026-10-12' },
        { goal, saved, kind: 'withdrawal' },
      ),
    ).toEqual({
      ok: false,
      errors: { amount: 'No podés retirar más de lo que tenés ahorrado ($ 450.000,00).' },
    })
  })

  it('gives every invalid field its message', () => {
    expect(
      parseContributionForm(
        { amount: '', occurredOn: '2026-02-30' },
        { goal, saved, kind: 'deposit' },
      ),
    ).toEqual({
      ok: false,
      errors: { amount: 'Ingresá un monto.', occurredOn: 'Ingresá una fecha válida.' },
    })
  })
})
