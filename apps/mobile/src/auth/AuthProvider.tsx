import { signInWithPassword } from '@chanchito/data'
import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthContext, type AuthContextValue } from './auth-context'

/** The session saved on the phone, kept up to date with Supabase's auth events. Needs a QueryClient. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session)
        setLoading(false)
      }
    })

    // Also fires when a refresh fails and the session ends, which takes the user back to login.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Signed out: forget the cached data, so it's never shown to the next session.
      if (!nextSession) queryClient.clear()
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signIn: (email, password) => signInWithPassword(supabase, email, password),
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
