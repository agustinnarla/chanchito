import type { SupabaseClient } from '@supabase/supabase-js'

/** Why signing in failed: wrong email or password, no connection, or anything else. */
export type SignInFailure = 'credentials' | 'network' | 'other'

export type SignInResult = { ok: true } | { ok: false; reason: SignInFailure; message: string }

/** Signs in with email and password, turning failures into a message in Spanish. */
export async function signInWithPassword(
  client: Pick<SupabaseClient, 'auth'>,
  email: string,
  password: string,
): Promise<SignInResult> {
  try {
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (!error) {
      return { ok: true }
    }
    if (error.code === 'invalid_credentials') {
      return {
        ok: false,
        reason: 'credentials',
        message: 'El email o la contraseña no coinciden.',
      }
    }
    return {
      ok: false,
      reason: 'other',
      message: 'No pudimos iniciar sesión. Probá de nuevo en un momento.',
    }
  } catch {
    return {
      ok: false,
      reason: 'network',
      message: 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.',
    }
  }
}
