import { afterEach, describe, expect, it } from 'vitest'
import { disableMotion, enableMotion } from '@/test/motion'
import { MAX_STAGGERED, shouldAnimate, staggerDelay } from './motion'

afterEach(disableMotion)

describe('staggerDelay', () => {
  it('grows with the index', () => {
    expect(staggerDelay(0)).toBe(0)
    expect(staggerDelay(1)).toBeGreaterThan(0)
    expect(staggerDelay(2)).toBeGreaterThan(staggerDelay(1))
  })

  it('never waits longer than for the last staggered item', () => {
    const last = staggerDelay(MAX_STAGGERED - 1)
    expect(staggerDelay(MAX_STAGGERED)).toBe(last)
    expect(staggerDelay(100)).toBe(last)
  })
})

describe('shouldAnimate', () => {
  it('is off without matchMedia, as in tests', () => {
    expect(shouldAnimate()).toBe(false)
  })

  it('is on when there is no reduced-motion preference', () => {
    enableMotion()
    expect(shouldAnimate()).toBe(true)
  })
})
