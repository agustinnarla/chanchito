import { parseEnv } from './env'

const valid = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
}

describe('parseEnv', () => {
  it('returns the Supabase URL and anon key', () => {
    expect(parseEnv(valid)).toEqual(valid)
  })

  it('names every missing or invalid variable', () => {
    expect(() => parseEnv({ EXPO_PUBLIC_SUPABASE_URL: 'not a url' })).toThrow(
      'Invalid or missing environment variables: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    )
  })

  it('rejects an empty anon key', () => {
    expect(() => parseEnv({ ...valid, EXPO_PUBLIC_SUPABASE_ANON_KEY: '' })).toThrow(
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    )
  })
})
