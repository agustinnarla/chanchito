/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  globalSetup: './jest.global-setup.js',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  // Most tests render the whole app; on the CI's slower machines that takes several seconds.
  testTimeout: 30_000,
  // Transpile React Native and Expo packages, which ship untranspiled code (pnpm layout).
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|standard-navigation))',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/test/**',
    // Routes: they only place the screens from src/features (tests can't live in src/app,
    // because Expo Router bundles every file there)
    '!src/app/**',
    // Wiring replaced by fakes in every test (jest.setup.ts); the data layer is tested in
    // packages/data against local Supabase
    '!src/lib/supabase.ts',
    '!src/lib/query-client.ts',
    '!src/data/api.ts',
  ],
  coverageReporters: ['text-summary', 'json-summary'],
  coverageThreshold: {
    global: { statements: 90, branches: 85, functions: 90, lines: 90 },
  },
}
