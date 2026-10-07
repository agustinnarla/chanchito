import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

describe('parseEnv', () => {
  it('returns the Supabase settings when they are valid', () => {
    const env = { VITE_SUPABASE_URL: 'https://abc.supabase.co', VITE_SUPABASE_ANON_KEY: 'key' }

    expect(parseEnv(env)).toEqual(env)
  })

  it('names the missing variables in the error', () => {
    expect(() => parseEnv({ VITE_SUPABASE_URL: 'https://abc.supabase.co' })).toThrow(
      /VITE_SUPABASE_ANON_KEY/,
    )
  })

  it('rejects an invalid URL', () => {
    expect(() =>
      parseEnv({ VITE_SUPABASE_URL: 'not a url', VITE_SUPABASE_ANON_KEY: 'key' }),
    ).toThrow(/VITE_SUPABASE_URL/)
  })
})
