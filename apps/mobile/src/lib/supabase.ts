// Gives Supabase a `localStorage` backed by SQLite, so the session survives restarts.
import 'expo-sqlite/localStorage/install'
import type { Database } from '@chanchito/data'
import { createClient } from '@supabase/supabase-js'
import { AppState } from 'react-native'
import { parseEnv } from './env'

// Expo only inlines EXPO_PUBLIC_* variables written out in full, so they're listed one by one.
const env = parseEnv({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
})

export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      // There's no URL to read a session from on Android.
      detectSessionInUrl: false,
    },
  },
)

// Refresh the token only while the app is in the foreground; on return, it renews right away.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh()
  } else {
    void supabase.auth.stopAutoRefresh()
  }
})
