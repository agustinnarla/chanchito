import { randomUUID } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { inject } from 'vitest'

const options = { auth: { persistSession: false, autoRefreshToken: false } }

/** Client without a session (the `anon` role). */
export function anonClient(): SupabaseClient {
  const { url, anonKey } = inject('supabase')
  return createClient(url, anonKey, options)
}

/**
 * Admin client for test setup only. Uses the service_role key of the LOCAL instance,
 * which bypasses RLS; never use it in the app.
 */
function adminClient(): SupabaseClient {
  const { url, serviceRoleKey } = inject('supabase')
  return createClient(url, serviceRoleKey, options)
}

export type TestUser = { id: string; client: SupabaseClient }

/** Creates a confirmed user with a random email and returns a client signed in as that user. */
export async function createTestUser(): Promise<TestUser> {
  const email = `test-${randomUUID()}@example.com`
  const password = randomUUID()

  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error

  const client = anonClient()
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) throw signInError

  return { id: data.user.id, client }
}

/** Deletes test users; their categories go with them (on delete cascade). */
export async function deleteTestUsers(...users: (TestUser | undefined)[]): Promise<void> {
  const admin = adminClient()
  for (const user of users) {
    if (!user) continue
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error
  }
}

/** Postgres error codes returned by PostgREST. */
export const PG = {
  insufficientPrivilege: '42501',
  uniqueViolation: '23505',
  checkViolation: '23514',
  invalidEnumValue: '22P02',
} as const
