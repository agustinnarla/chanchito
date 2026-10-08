import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createFakeSupabaseAuth,
  fakeSession,
  VALID_EMAIL,
  VALID_PASSWORD,
} from '@/test/fake-supabase-auth'
import { renderApp } from '@/test/render-app'

const auth = vi.hoisted(() => ({ fake: null as ReturnType<typeof createFakeSupabaseAuth> | null }))

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabaseAuth } = await import('@/test/fake-supabase-auth')
  auth.fake = createFakeSupabaseAuth()
  return { supabase: { auth: auth.fake } }
})

function fakeAuth() {
  if (!auth.fake) throw new Error('Supabase mock not initialized')
  return auth.fake
}

async function fillLogin(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Contraseña'), password)
  await user.click(screen.getByRole('button', { name: 'Ingresar' }))
}

describe('authentication', () => {
  beforeEach(async () => {
    await import('@/lib/supabase')
    fakeAuth().reset()
  })

  it('redirects to /login when there is no session', async () => {
    const { router } = renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('logs in with valid credentials and shows the home page', async () => {
    const { router } = renderApp('/')

    await fillLogin(VALID_EMAIL, VALID_PASSWORD)

    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
    expect(fakeAuth().signInWithPassword).toHaveBeenCalledWith({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    })
  })

  it('shows an error and stays on /login with wrong credentials', async () => {
    const { router } = renderApp('/login')

    await fillLogin(VALID_EMAIL, 'incorrecta')

    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos.')
    expect(router.state.location.pathname).toBe('/login')
  })

  it('shows a generic error for other auth failures', async () => {
    fakeAuth().signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { code: 'over_request_rate_limit', message: 'Too many requests' },
    })
    renderApp('/login')

    await fillLogin(VALID_EMAIL, VALID_PASSWORD)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo iniciar sesión. Probá de nuevo en un momento.',
    )
  })

  it('shows a connection error when the request fails', async () => {
    fakeAuth().signInWithPassword.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    renderApp('/login')

    await fillLogin(VALID_EMAIL, VALID_PASSWORD)

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar.')
  })

  it('logs out and goes back to /login', async () => {
    fakeAuth().reset(fakeSession())
    const { router } = renderApp('/')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(fakeAuth().signOut).toHaveBeenCalled()
  })

  it('redirects /login to the home page when already logged in', async () => {
    fakeAuth().reset(fakeSession())
    const { router } = renderApp('/login')

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })
})
