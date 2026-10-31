import {
  anonClient,
  createTestCredentials,
  deleteTestUsers,
  type LocalSupabase,
  type TestCredentials,
} from '@chanchito/supabase/testing'
import { createClient } from '@supabase/supabase-js'
import { inject } from 'vitest'
import type { Client } from '../client'
import type { Database } from '../database.types'

declare module 'vitest' {
  export interface ProvidedContext {
    supabase: LocalSupabase
  }
}

/** The client the data layer runs on in these tests, like the app's but against local Supabase. */
export const client: Client = createClient<Database>(
  inject('supabase').url,
  inject('supabase').anonKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

/** Creates a test user and signs the client in as that user. */
export async function signInAsNewUser(): Promise<TestCredentials> {
  const credentials = await createTestCredentials(inject('supabase'))
  const { error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })
  if (error) throw error
  return credentials
}

/** Signs the client out and deletes the users (their rows go with them). */
export async function cleanUpUsers(...users: (TestCredentials | undefined)[]): Promise<void> {
  await client.auth.signOut()
  await deleteTestUsers(inject('supabase'), ...users)
}

/** A separate client signed in as another user, to check isolation between users. */
export async function otherUserClient() {
  const local = inject('supabase')
  const credentials = await createTestCredentials(local)
  const other = anonClient(local)
  const { error } = await other.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })
  if (error) throw error
  return { credentials, client: other }
}
