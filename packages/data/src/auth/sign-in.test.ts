import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { signInWithPassword } from './sign-in'

/** A client whose sign-in answers with the given error, or throws. */
function clientAnswering(answer: { code: string } | null | 'throw') {
  const signIn = vi.fn(async () => {
    if (answer === 'throw') throw new TypeError('Network request failed')
    return { error: answer }
  })
  return { client: { auth: { signInWithPassword: signIn } } as unknown as SupabaseClient, signIn }
}

describe('signInWithPassword', () => {
  it('signs in with the email and password', async () => {
    const { client, signIn } = clientAnswering(null)

    expect(await signInWithPassword(client, 'yo@example.com', 'secreta')).toEqual({ ok: true })
    expect(signIn).toHaveBeenCalledWith({ email: 'yo@example.com', password: 'secreta' })
  })

  it('says when the email or password are wrong', async () => {
    const { client } = clientAnswering({ code: 'invalid_credentials' })

    expect(await signInWithPassword(client, 'yo@example.com', 'mal')).toEqual({
      ok: false,
      reason: 'credentials',
      message: 'El email o la contraseña no coinciden.',
    })
  })

  it('gives a generic message for other errors', async () => {
    const { client } = clientAnswering({ code: 'over_request_rate_limit' })

    expect(await signInWithPassword(client, 'yo@example.com', 'secreta')).toEqual({
      ok: false,
      reason: 'other',
      message: 'No pudimos iniciar sesión. Probá de nuevo en un momento.',
    })
  })

  it('says when there is no connection', async () => {
    const { client } = clientAnswering('throw')

    expect(await signInWithPassword(client, 'yo@example.com', 'secreta')).toEqual({
      ok: false,
      reason: 'network',
      message: 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.',
    })
  })
})
