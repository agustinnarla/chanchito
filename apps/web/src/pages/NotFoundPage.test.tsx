import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithQuery } from '@/test/render-with-query'
import { NotFoundPage } from './NotFoundPage'

describe('NotFoundPage', () => {
  it('says the page does not exist and links to the home page', () => {
    renderWithQuery(<NotFoundPage />, { route: '/no-existe' })

    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir a Inicio' })).toHaveAttribute('href', '/')
  })
})
