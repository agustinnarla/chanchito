import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // *.db.test.ts need local Supabase; they run with vitest.db.config.ts (`pnpm test:db`).
    exclude: ['**/node_modules/**', '**/*.db.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        'src/test/**',
        'src/index.ts',
        // Generated code and types only
        'src/database.types.ts',
        'src/client.ts',
        // Covered by the *.db.test.ts integration tests against local Supabase
        'src/**/api.ts',
      ],
      reporter: ['text-summary', 'json-summary'],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
})
