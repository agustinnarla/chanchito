/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  globalSetup: './jest.global-setup.js',
  // Transpile React Native and Expo packages, which ship untranspiled code (pnpm layout).
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*))',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/test/**',
    // Routes: they only place the screens from src/features (tests can't live in src/app,
    // because Expo Router bundles every file there)
    '!src/app/**',
    // Client wiring: needs the native modules and a real Supabase
    '!src/lib/supabase.ts',
  ],
  coverageReporters: ['text-summary', 'json-summary'],
  coverageThreshold: {
    global: { statements: 90, branches: 85, functions: 90, lines: 90 },
  },
}
