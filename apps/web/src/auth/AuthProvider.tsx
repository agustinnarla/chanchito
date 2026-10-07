import type { Session } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthContext, type AuthContextValue, type SignInResult } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session)
        setLoading(false)
      }
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signIn: async (email, password): Promise<SignInResult> => {
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (!error) {
            return { ok: true }
          }
          if (error.code === 'invalid_credentials') {
            return { ok: false, message: 'Email o contraseña incorrectos.' }
          }
          return { ok: false, message: 'No se pudo iniciar sesión. Probá de nuevo en un momento.' }
        } catch {
          return { ok: false, message: 'No se pudo conectar. Revisá tu conexión y probá de nuevo.' }
        }
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
