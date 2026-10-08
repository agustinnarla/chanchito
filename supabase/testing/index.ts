import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Test helpers for the LOCAL Supabase started with `pnpm db:start`.
 * The service_role key here is the local demo key; never use these helpers in the app.
 */

export type LocalSupabase = { url: string; anonKey: string; serviceRoleKey: string }

const cli = path.resolve(import.meta.dirname, '../node_modules/.bin/supabase')
const repoRoot = path.resolve(import.meta.dirname, '../..')

/** Reads the URL and keys of the running local Supabase, or fails with a clear message. */
export function readLocalSupabase(): LocalSupabase {
  let output: string
  try {
    output = execFileSync(cli, ['status', '--output', 'json', '--workdir', repoRoot], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch {
    throw new Error('Supabase local no está corriendo. Levantalo con `pnpm db:start`.')
  }
  const status = JSON.parse(output) as {
    API_URL: string
    ANON_KEY: string
    SERVICE_ROLE_KEY: string
  }
  return { url: status.API_URL, anonKey: status.ANON_KEY, serviceRoleKey: status.SERVICE_ROLE_KEY }
}

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } }

/** Client without a session (the `anon` role). */
export function anonClient(local: LocalSupabase): SupabaseClient {
  return createClient(local.url, local.anonKey, clientOptions)
}

/** Admin client that bypasses RLS: only for creating and deleting test users. */
function adminClient(local: LocalSupabase): SupabaseClient {
  return createClient(local.url, local.serviceRoleKey, clientOptions)
}

export type TestCredentials = { id: string; email: string; password: string }

/** Creates a confirmed user with a random email. */
export async function createTestCredentials(local: LocalSupabase): Promise<TestCredentials> {
  const email = `test-${randomUUID()}@example.com`
  const password = randomUUID()
  const { data, error } = await adminClient(local).auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  return { id: data.user.id, email, password }
}

/** Deletes test users; their rows go with them (on delete cascade). */
export async function deleteTestUsers(
  local: LocalSupabase,
  ...users: ({ id: string } | undefined)[]
): Promise<void> {
  const admin = adminClient(local)
  for (const user of users) {
    if (!user) continue
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error
  }
}
