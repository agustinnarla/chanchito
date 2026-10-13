import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { disableMotion, enableMotion } from '@/test/motion'
import { usePop } from './use-pop'

afterEach(disableMotion)

function Choice({ active }: { active: boolean }) {
  const ref = usePop<HTMLSpanElement>(active)
  return <span ref={ref}>Emoji</span>
}

const emoji = () => screen.getByText('Emoji')

describe('usePop', () => {
  it('does not pop on mount, even when active', () => {
    enableMotion()
    render(<Choice active />)
    expect(emoji().style.transform).toBe('')
  })

  it('pops when it turns on and ends at its normal size', async () => {
    enableMotion()
    const { rerender } = render(<Choice active={false} />)

    rerender(<Choice active />)
    expect(emoji().style.transform).toContain('scale')

    await waitFor(() => expect(emoji().style.transform).toBe(''))
  })

  it('does not pop with reduced motion', () => {
    const { rerender } = render(<Choice active={false} />)
    rerender(<Choice active />)
    expect(emoji().style.transform).toBe('')
  })
})
