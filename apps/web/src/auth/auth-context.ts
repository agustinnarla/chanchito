import type { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export type SignInResult = { ok: true } | { ok: false; message: string }

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
