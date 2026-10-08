import type { SupabaseClient } from '@supabase/supabase-js'
import { inject } from 'vitest'
import * as testing from '../testing'

export type TestUser = { id: string; client: SupabaseClient }

/** Client without a session (the `anon` role). */
export function anonClient(): SupabaseClient {
  return testing.anonClient(inject('supabase'))
}

/** Creates a confirmed user and returns a client signed in as that user. */
export async function createTestUser(): Promise<TestUser> {
  const local = inject('supabase')
  const { id, email, password } = await testing.createTestCredentials(local)
  const client = testing.anonClient(local)
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { id, client }
}

export async function deleteTestUsers(...users: (TestUser | undefined)[]): Promise<void> {
  await testing.deleteTestUsers(inject('supabase'), ...users)
}

/** Postgres error codes returned by PostgREST. */
export const PG = {
  insufficientPrivilege: '42501',
  uniqueViolation: '23505',
  checkViolation: '23514',
  invalidEnumValue: '22P02',
} as const
