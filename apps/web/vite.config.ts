import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // *.db.test.ts need local Supabase; they run with vitest.db.config.ts (`pnpm test:db`).
    exclude: ['**/node_modules/**', '**/*.db.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        'src/test/**',
        // Generated code
        'src/components/ui/**',
        'src/lib/database.types.ts',
        // App bootstrap: no logic of its own
        'src/main.tsx',
        'src/App.tsx',
        'src/router.ts',
        // Data layer: covered by the *.db.test.ts integration tests against local Supabase
        'src/lib/supabase.ts',
        'src/features/**/api.ts',
      ],
      reporter: ['text-summary', 'json-summary'],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
})
