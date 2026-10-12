import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { disableMotion, enableMotion, seekAnimations } from '@/test/motion'
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

  it('counts up to the exact target in whole cents', () => {
    enableMotion(1)
    seen.length = 0
    render(<Counter target={98765} />)

    for (const progress of [0.1, 0.33, 0.5, 0.77]) act(() => seekAnimations(progress))
    expect(new Set(seen).size).toBeGreaterThan(3)
    act(() => seekAnimations(1))

    expect(screen.getByRole('status')).toHaveTextContent('98765')
    expect(seen.every(Number.isInteger)).toBe(true)
  })

  it('goes from the value on screen to a new target, through zero without -0', () => {
    enableMotion(1)
    const { rerender } = render(<Counter target={1000} />)
    act(() => seekAnimations(1))
    expect(screen.getByRole('status')).toHaveTextContent('1000')

    seen.length = 0
    rerender(<Counter target={-1000} />)
    for (let progress = 0; progress <= 1; progress += 0.01) act(() => seekAnimations(progress))
    act(() => seekAnimations(1))

    expect(screen.getByRole('status')).toHaveTextContent('-1000')
    expect(seen.every((v) => Number.isInteger(v) && !Object.is(v, -0))).toBe(true)
  })
})
