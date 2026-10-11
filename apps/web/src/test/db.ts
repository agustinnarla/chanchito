import {
  anonClient,
  createTestCredentials,
  deleteTestUsers,
  type LocalSupabase,
  type TestCredentials,
} from '@chanchito/supabase/testing'
import { inject } from 'vitest'
import { supabase } from '@/lib/supabase'

declare module 'vitest' {
  export interface ProvidedContext {
    supabase: LocalSupabase
  }
}

/** Creates a test user and signs the app's Supabase client in as that user. */
export async function signInAsNewUser(): Promise<TestCredentials> {
  const credentials = await createTestCredentials(inject('supabase'))
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })
  if (error) throw error
  return credentials
}

/** Signs the app client out and deletes the users (their rows go with them). */
export async function cleanUpUsers(...users: (TestCredentials | undefined)[]): Promise<void> {
  await supabase.auth.signOut()
  await deleteTestUsers(inject('supabase'), ...users)
}

/** A separate client signed in as another user, to check isolation between users. */
export async function otherUserClient() {
  const local = inject('supabase')
  const credentials = await createTestCredentials(local)
  const client = anonClient(local)
  const { error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })
  if (error) throw error
  return { credentials, client }
}
