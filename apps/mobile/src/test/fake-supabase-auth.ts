import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

type Listener = (event: AuthChangeEvent, session: Session | null) => void

export const VALID_EMAIL = 'yo@example.com'
export const VALID_PASSWORD = 'secreta-123'

// Only the fields the app reads; a full Session is not needed in tests.
export const fakeSession = (email = VALID_EMAIL) =>
  ({ access_token: 'token', user: { id: 'user-1', email } }) as unknown as Session

/** In-memory stand-in for `supabase.auth` with a single valid user, like the web's. */
export function createFakeSupabaseAuth() {
  let session: Session | null = null
  const listeners = new Set<Listener>()
  const emit = (event: AuthChangeEvent) => listeners.forEach((listener) => listener(event, session))

  return {
    reset(initial: Session | null = null) {
      session = initial
      listeners.clear()
      jest.clearAllMocks()
    },
    /** The session ends on its own, as when a refresh fails. */
    expire() {
      session = null
      emit('SIGNED_OUT')
    },
    getSession: jest.fn(async () => ({ data: { session }, error: null })),
    onAuthStateChange: jest.fn((listener: Listener) => {
      listeners.add(listener)
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } }
    }),
    signInWithPassword: jest.fn(
      async ({ email, password }: { email: string; password: string }) => {
        if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
          return {
            data: { user: null, session: null },
            error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
          }
        }
        session = fakeSession(email)
        emit('SIGNED_IN')
        return { data: { user: session.user, session }, error: null }
      },
    ),
    signOut: jest.fn(async () => {
      session = null
      emit('SIGNED_OUT')
      return { error: null }
    }),
  }
}

/** One instance per test file, shared with the mocked `@/lib/supabase`. */
export const fakeAuth = createFakeSupabaseAuth()
