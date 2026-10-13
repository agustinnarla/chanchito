import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the main navigation', async () => {
    renderApp('/')

    const nav = await screen.findByRole('navigation', { name: 'Principal' })
    const links = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent)

    expect(links).toEqual([
      'Inicio',
      'Movimientos',
      'Balance',
      'Presupuestos',
      'Ahorros',
      'Categorías',
    ])
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

  describe('side menu', () => {
    it('minimizes to icons and opens again, remembering the choice', async () => {
      renderApp('/')
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Minimizar menú' }))

      const nav = screen.getByRole('navigation', { name: 'Principal' })
      expect(within(nav).getByRole('link', { name: 'Balance' })).not.toHaveTextContent('Balance')
      expect(screen.getByRole('button', { name: 'Nuevo movimiento' })).toBeInTheDocument()
      expect(localStorage.getItem('chanchito:menu-open')).toBe('false')

      await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
      expect(within(nav).getByRole('link', { name: 'Balance' })).toHaveTextContent('Balance')
    })

    it('starts minimized when that was the last choice', async () => {
      localStorage.setItem('chanchito:menu-open', 'false')
      renderApp('/')

      expect(await screen.findByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
        'aria-expanded',
        'false',
      )
    })

    it('opens the appearance dialog to switch the theme', async () => {
      renderApp('/')
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Apariencia' }))
      const dialog = await screen.findByRole('dialog', { name: 'Apariencia' })
      await user.click(within(dialog).getByRole('radio', { name: 'Oscuro' }))

      expect(document.documentElement).toHaveClass('dark')
    })
  })

  describe('on a phone', () => {
    beforeEach(() => {
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: query === '(max-width: 767px)',
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }))
    })

    it('shows the sections in a bottom bar and a floating button for a new movement', async () => {
      const { router } = renderApp('/')
      const user = userEvent.setup()

      const nav = await screen.findByRole('navigation', { name: 'Principal' })
      expect(
        within(nav)
          .getAllByRole('link')
          .map((link) => link.textContent),
      ).toEqual(['Inicio', 'Movimientos', 'Balance', 'Ahorros'])
      expect(screen.queryByRole('button', { name: 'Minimizar menú' })).not.toBeInTheDocument()

      // Presupuestos and Categorías are under "Más"
      await user.click(within(nav).getByRole('button', { name: 'Más' }))
      const more = await screen.findByRole('dialog', { name: 'Más secciones' })
      await user.click(within(more).getByRole('link', { name: 'Categorías' }))
      expect(router.state.location.pathname).toBe('/categorias')
      await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

      // Apariencia is under "Más" too
      await user.click(within(nav).getByRole('button', { name: 'Más' }))
      await user.click(
        within(await screen.findByRole('dialog', { name: 'Más secciones' })).getByRole('button', {
          name: 'Apariencia',
        }),
      )
      expect(await screen.findByRole('dialog', { name: 'Apariencia' })).toBeInTheDocument()
      await user.keyboard('{Escape}')
      await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: 'Nuevo movimiento' }))
      expect(await screen.findByRole('dialog', { name: 'Nuevo movimiento' })).toBeInTheDocument()
    })

    it('opens the appearance dialog and logs out from the top bar', async () => {
      renderApp('/')
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Apariencia' }))
      const dialog = await screen.findByRole('dialog', { name: 'Apariencia' })
      await user.click(within(dialog).getByRole('radio', { name: 'Oscuro' }))
      expect(document.documentElement).toHaveClass('dark')
      await user.click(within(dialog).getByRole('button', { name: 'Listo' }))

      await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
      expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    })
  })
})
