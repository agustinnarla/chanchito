import { gsap } from 'gsap'
import { vi } from 'vitest'

/**
 * Turns animations on (no reduced-motion preference) and runs them `speed` times faster.
 * Call `vi.unstubAllGlobals()` and `disableMotion()` after each test.
 */
export function enableMotion(speed = 50) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-reduced-motion: no-preference)',
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  gsap.globalTimeline.timeScale(speed)
}

export function disableMotion() {
  vi.unstubAllGlobals()
  gsap.globalTimeline.timeScale(1)
}
