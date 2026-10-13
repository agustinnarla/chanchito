import type { TestCredentials } from '@chanchito/supabase/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { supabase } from '@/lib/supabase'
import { cleanUpUsers, otherUserClient, signInAsNewUser } from '@/test/db'
import { loadAccent, saveAccent } from './api'

let user: TestCredentials | undefined

beforeEach(async () => {
  user = await signInAsNewUser()
})

afterEach(async () => {
  await cleanUpUsers(user)
  user = undefined
})

describe('accent', () => {
  it('has none until one is chosen, then saves and changes it', async () => {
    expect(await loadAccent()).toBeNull()

    await saveAccent('azul')
    expect(await loadAccent()).toBe('azul')

    await saveAccent('naranja')
    expect(await loadAccent()).toBe('naranja')
  })

  it("is only the user's own", async () => {
    await saveAccent('rosa')
    const other = await otherUserClient()
    try {
      const { data } = await other.client.from('user_preferences').select('accent')
      expect(data).toEqual([])
    } finally {
      await cleanUpUsers(other.credentials)
    }
  })
})

describe('without a session', () => {
  it('reports errors in Spanish', async () => {
    await supabase.auth.signOut()

    await expect(loadAccent()).rejects.toThrow('No se pudo cargar el color de tu cuenta.')
    await expect(saveAccent('azul')).rejects.toThrow('No se pudo guardar el color en tu cuenta.')
  })
})
