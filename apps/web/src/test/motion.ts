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

/** Moves every running animation to `progress` (0 to 1) at once, without waiting for frames. */
export function seekAnimations(progress: number) {
  for (const animation of gsap.globalTimeline.getChildren(true, true, false)) {
    animation.progress(progress)
  }
}

export function disableMotion() {
  vi.unstubAllGlobals()
  gsap.globalTimeline.timeScale(1)
}
