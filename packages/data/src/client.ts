import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/** A Supabase client typed with the database schema. Each app creates its own. */
export type Client = SupabaseClient<Database>
