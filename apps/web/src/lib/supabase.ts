import { createClient } from '@supabase/supabase-js'
import type { Database } from '@chanchito/data'
import { parseEnv } from './env'

const env = parseEnv(import.meta.env)

export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
