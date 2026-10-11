import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Dates must be computed in local time; run tests in Argentina's timezone (UTC-3).
    env: { TZ: 'America/Argentina/Buenos_Aires' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts', 'src/**/types.ts'],
      reporter: ['text-summary', 'json-summary'],
      // Domain logic is written test-first: keep it fully covered.
      thresholds: { statements: 95, branches: 95, functions: 95, lines: 95 },
    },
  },
})
