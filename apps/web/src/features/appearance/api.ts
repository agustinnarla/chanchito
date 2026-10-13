import { resolveAccent, type Accent } from '@chanchito/core'
import { supabase } from '@/lib/supabase'

/** Error with a user-facing message in Spanish. */
export class PreferencesError extends Error {
  override readonly name = 'PreferencesError'
}

/** The accent saved in the account, or null when none was chosen yet. */
export async function loadAccent(): Promise<Accent | null> {
  const { data, error } = await supabase.from('user_preferences').select('accent').maybeSingle()
  if (error) throw new PreferencesError('No se pudo cargar el color de tu cuenta.')
  return data ? resolveAccent(data.accent) : null
}

/** Saves the accent in the account; the first time it creates the row. */
export async function saveAccent(accent: Accent): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: auth.user?.id, accent, updated_at: new Date().toISOString() })
  if (error) throw new PreferencesError('No se pudo guardar el color en tu cuenta.')
}
