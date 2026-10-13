import { useRef } from 'react'
import { DURATION, EASE, gsap, shouldAnimate, useGSAP } from './motion'

/** A quick "pop" each time `active` turns on, like an emoji when it's chosen. Not on mount. */
export function usePop<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null)
  const mounted = useRef(false)

  useGSAP(
    () => {
      const wasMounted = mounted.current
      mounted.current = true
      if (!wasMounted || !active || !shouldAnimate()) return
      gsap.fromTo(
        ref.current,
        { scale: 0.6 },
        { scale: 1, duration: DURATION.medium, ease: EASE.pop, clearProps: 'transform' },
      )
    },
    { dependencies: [active] },
  )

  return ref
}
