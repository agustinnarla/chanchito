import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/global-setup.ts'],
    // Tests share one local database; run files one after another.
    fileParallelism: false,
    testTimeout: 15_000,
  },
})
