import { cleanup, screen, waitFor } from '@testing-library/react'
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
    localStorage.clear()
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

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El email o la contraseña no coinciden.',
    )
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
      'No pudimos iniciar sesión. Probá de nuevo en un momento.',
    )
  })

  it('shows a connection error when the request fails', async () => {
    fakeAuth().signInWithPassword.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    renderApp('/login')

    await fillLogin(VALID_EMAIL, VALID_PASSWORD)

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectarnos.')
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

  describe('login screen (spec 011)', () => {
    it('remembers the email for next time, and forgets it on request', async () => {
      const first = renderApp('/login')
      await fillLogin(VALID_EMAIL, VALID_PASSWORD)
      await waitFor(() => expect(first.router.state.location.pathname).toBe('/'))
      expect(localStorage.getItem('chanchito:last-email')).toBe(VALID_EMAIL)
      cleanup()

      fakeAuth().reset()
      renderApp('/login')
      const user = userEvent.setup()
      expect(await screen.findByLabelText('Email')).toHaveValue(VALID_EMAIL)
      expect(screen.getByText('Recordado')).toBeInTheDocument()
      expect(screen.getByText('Qué bueno verte de nuevo.')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: '¿No sos vos? Usar otro email' }))

      expect(screen.getByLabelText('Email')).toHaveValue('')
      expect(screen.getByLabelText('Email')).toHaveFocus()
      expect(localStorage.getItem('chanchito:last-email')).toBeNull()
    })

    it('shows and hides the password', async () => {
      renderApp('/login')
      const user = userEvent.setup()
      const password = await screen.findByLabelText('Contraseña')
      expect(password).toHaveAttribute('type', 'password')

      await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
      expect(password).toHaveAttribute('type', 'text')

      await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
      expect(password).toHaveAttribute('type', 'password')
    })

    it('warns when Caps Lock is on while typing the password', async () => {
      renderApp('/login')
      const user = userEvent.setup()
      await user.click(await screen.findByLabelText('Contraseña'))

      await user.keyboard('{CapsLock}a')
      expect(screen.getByText('Bloq Mayús está activado.')).toBeInTheDocument()
      expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription(
        'Bloq Mayús está activado.',
      )

      await user.keyboard('{CapsLock}a')
      expect(screen.queryByText('Bloq Mayús está activado.')).not.toBeInTheDocument()
    })

    it('marks the password and explains what to do when they do not match', async () => {
      renderApp('/login')
      await fillLogin(VALID_EMAIL, 'incorrecta')

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'El email o la contraseña no coinciden.Revisalos y probá de nuevo.',
      )
      expect(screen.getByLabelText('Contraseña')).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows that it is signing in, without letting it submit twice', async () => {
      let finish: () => void = () => {}
      fakeAuth().signInWithPassword.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = () =>
              resolve({
                data: { user: null, session: null },
                error: { code: 'other', message: '' },
              })
          }),
      )
      renderApp('/login')
      await fillLogin(VALID_EMAIL, VALID_PASSWORD)

      const button = screen.getByRole('button', { name: 'Ingresando…' })
      expect(button).toBeDisabled()
      finish()
      expect(await screen.findByRole('button', { name: 'Ingresar' })).toBeEnabled()
    })
  })
})
