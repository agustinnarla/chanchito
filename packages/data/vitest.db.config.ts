import { readLocalSupabase } from '@chanchito/supabase/testing'
import { defineConfig } from 'vitest/config'

// Integration tests for the data layer against the local Supabase (`pnpm db:start`).
const local = readLocalSupabase()

export default defineConfig({
  test: {
    include: ['src/**/*.db.test.ts'],
    environment: 'node',
    provide: { supabase: local },
    // One shared local database: run files one after another.
    fileParallelism: false,
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/api.ts'],
      reporter: ['text-summary', 'json-summary'],
      reportsDirectory: './coverage/db',
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
})
