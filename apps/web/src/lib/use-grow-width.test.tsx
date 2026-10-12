import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { disableMotion, enableMotion } from '@/test/motion'
import { useGrowWidth } from './use-grow-width'

afterEach(disableMotion)

function Bar({ percent }: { percent: number }) {
  const ref = useGrowWidth<HTMLSpanElement>(percent)
  return <span ref={ref} role="img" aria-label="Barra" />
}

const bar = () => screen.getByRole('img', { name: 'Barra' })

describe('useGrowWidth', () => {
  it('sets the final width at once with reduced motion', () => {
    const { rerender } = render(<Bar percent={40} />)
    expect(bar().style.width).toBe('40%')

    rerender(<Bar percent={75} />)
    expect(bar().style.width).toBe('75%')
  })

  it('grows to the final width', async () => {
    enableMotion()
    const { rerender } = render(<Bar percent={60} />)
    await waitFor(() => expect(bar().style.width).toBe('60%'))

    rerender(<Bar percent={20} />)
    await waitFor(() => expect(bar().style.width).toBe('20%'))
  })
})
