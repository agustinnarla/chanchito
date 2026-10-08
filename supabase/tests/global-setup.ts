import { execFileSync } from 'node:child_process'
import path from 'node:path'
import type { TestProject } from 'vitest/node'

type Status = { API_URL: string; ANON_KEY: string; SERVICE_ROLE_KEY: string }

declare module 'vitest' {
  export interface ProvidedContext {
    supabase: { url: string; anonKey: string; serviceRoleKey: string }
  }
}

/** Reads the URL and keys of the local Supabase started with `pnpm db:start`. */
export default function setup(project: TestProject) {
  let status: Status
  try {
    const output = execFileSync(
      'supabase',
      ['status', '--output', 'json', '--workdir', path.resolve(import.meta.dirname, '../..')],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
    status = JSON.parse(output) as Status
  } catch {
    throw new Error('Supabase local no está corriendo. Levantalo con `pnpm db:start`.')
  }

  project.provide('supabase', {
    url: status.API_URL,
    anonKey: status.ANON_KEY,
    serviceRoleKey: status.SERVICE_ROLE_KEY,
  })
}
