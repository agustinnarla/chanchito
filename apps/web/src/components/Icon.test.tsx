import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Icon } from './Icon'
import { ICON_PATHS } from './icons'

describe('Icon', () => {
  it('draws the outlined path by default and the filled one when asked, hidden from readers', () => {
    const { container, rerender } = render(<Icon name="home" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('path')).toHaveAttribute('d', ICON_PATHS.home[0])

    rerender(<Icon name="home" filled />)
    expect(container.querySelector('path')).toHaveAttribute('d', ICON_PATHS.home[1])
  })
})
