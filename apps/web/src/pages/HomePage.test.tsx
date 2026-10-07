import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('shows the balance per currency formatted with formatMoney', () => {
    render(<HomePage />)

    expect(screen.getByText('$ 0,00')).toBeInTheDocument()
    expect(screen.getByText('US$ 0,00')).toBeInTheDocument()
  })
})
