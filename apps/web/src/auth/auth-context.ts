import type { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

/** Why signing in failed: wrong email or password, no connection, or anything else. */
export type SignInFailure = 'credentials' | 'network' | 'other'

export type SignInResult = { ok: true } | { ok: false; reason: SignInFailure; message: string }

export type AuthContextValue = {
  session: Session | null
  /** True until the initial session has been read from storage. */
  loading: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return value
}
