import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { disableMotion, enableMotion } from '@/test/motion'
import { useCountUp } from './use-count-up'

afterEach(disableMotion)

const seen: number[] = []

function Counter({ target }: { target: number }) {
  const value = useCountUp(target)
  seen.push(value)
  return <output>{value}</output>
}

describe('useCountUp', () => {
  it('shows the target at once with reduced motion', () => {
    const { rerender } = render(<Counter target={12345} />)
    expect(screen.getByRole('status')).toHaveTextContent('12345')

    rerender(<Counter target={-500} />)
    expect(screen.getByRole('status')).toHaveTextContent('-500')
  })

  it('counts up to the exact target in whole cents', async () => {
    // Slow enough to see the steps in between
    enableMotion(5)
    seen.length = 0
    render(<Counter target={98765} />)

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('98765'))
    expect(seen.length).toBeGreaterThan(2)
    expect(seen.every(Number.isInteger)).toBe(true)
  })

  it('goes from the value on screen to a new target, through zero without -0', async () => {
    // Slow enough to see the steps in between
    enableMotion(5)
    const { rerender } = render(<Counter target={1000} />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1000'))

    seen.length = 0
    act(() => rerender(<Counter target={-1000} />))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('-1000'))
    expect(seen.every((v) => Number.isInteger(v) && !Object.is(v, -0))).toBe(true)
    expect(seen.some((v) => v > -1000 && v < 1000)).toBe(true)
  })
})
