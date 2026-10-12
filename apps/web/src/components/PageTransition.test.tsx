import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { Link, MemoryRouter, Route, Routes, useSearchParams } from 'react-router'
import { disableMotion, enableMotion, seekAnimations } from '@/test/motion'
import { PageTransition } from './PageTransition'

afterEach(disableMotion)

function Page({ name }: { name: string }) {
  const [, setParams] = useSearchParams()
  return (
    <>
      <h1>{name}</h1>
      <button type="button" onClick={() => setParams({ mes: '2026-09' })}>
        Mes anterior
      </button>
      <Link to="/otra">Otra sección</Link>
    </>
  )
}

function renderPages() {
  render(
    <MemoryRouter>
      <PageTransition>
        <Routes>
          <Route path="/" element={<Page name="Inicio" />} />
          <Route path="/otra" element={<Page name="Otra" />} />
        </Routes>
      </PageTransition>
    </MemoryRouter>,
  )
  // The wrapper around the page, which is what fades in
  return () => screen.getByRole('heading', { hidden: true }).parentElement as HTMLElement
}

describe('PageTransition', () => {
  it('shows the page at once with reduced motion', () => {
    const page = renderPages()
    expect(page()).not.toHaveAttribute('style')
  })

  it('brings the page in when the section changes, not when the month does', async () => {
    enableMotion(0.001) // Nearly stopped, to look at the start of the animation
    const page = renderPages()
    const user = userEvent.setup()
    expect(page().style.opacity).toBe('0')

    // Once it ends, its styles are cleared
    seekAnimations(1)
    expect(page().style.opacity).toBe('')

    await user.click(screen.getByRole('button', { name: 'Mes anterior' }))
    expect(page().style.opacity).toBe('')

    await user.click(screen.getByRole('link', { name: 'Otra sección' }))
    expect(screen.getByText('Otra')).toBeInTheDocument()
    expect(Number(page().style.opacity)).toBeLessThan(0.1)
  })
})
