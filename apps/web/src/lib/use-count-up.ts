import { useEffect, useRef, useState } from 'react'
import { DURATION, EASE, gsap, shouldAnimate } from './motion'

/**
 * An integer amount (cents) that counts up to `target`: from 0 when it appears, then from the
 * value on screen to each new target. Every step is rounded, so it is always whole cents.
 */
export function useCountUp(target: number): number {
  const [animate] = useState(shouldAnimate)
  const [value, setValue] = useState(0)
  const shown = useRef(0)

  useEffect(() => {
    if (!animate) return
    const state = { value: shown.current }
    const tween = gsap.to(state, {
      value: target,
      duration: DURATION.long,
      ease: EASE.emphasized,
      onUpdate: () => {
        // `|| 0` turns -0 into 0, so a sign change never shows "-$ 0"
        shown.current = Math.round(state.value) || 0
        setValue(shown.current)
      },
    })
    return () => {
      tween.kill()
    }
  }, [animate, target])

  return animate ? value : target
}
