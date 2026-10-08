import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeSupabaseAuth, fakeSession } from '@/test/fake-supabase-auth'
import { renderApp } from '@/test/render-app'

const auth = vi.hoisted(() => ({ fake: null as ReturnType<typeof createFakeSupabaseAuth> | null }))

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabaseAuth } = await import('@/test/fake-supabase-auth')
  auth.fake = createFakeSupabaseAuth()
  return { supabase: { auth: auth.fake } }
})

describe('Layout', () => {
  beforeEach(async () => {
    await import('@/lib/supabase')
    auth.fake?.reset(fakeSession())
  })

  it('shows the main navigation', async () => {
    renderApp('/')

    const nav = await screen.findByRole('navigation', { name: 'Principal' })
    const links = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent)

    expect(links).toEqual(['Movimientos', 'Balance', 'Presupuestos', 'Categorías'])
  })

  it('navigates to each section and marks it as active', async () => {
    const { router } = renderApp('/')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('link', { name: 'Presupuestos' }))

    expect(await screen.findByRole('heading', { name: 'Presupuestos' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/presupuestos')
    expect(screen.getByRole('link', { name: 'Presupuestos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it.each(['/', '/categorias', '/balance'])('offers "Nuevo movimiento" on %s', async (path) => {
    renderApp(path)

    expect(await screen.findByRole('button', { name: 'Nuevo movimiento' })).toBeInTheDocument()
  })

  it('protects the sections too', async () => {
    auth.fake?.reset()
    const { router } = renderApp('/movimientos')

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })
})
