import { useRef } from 'react'
import { DURATION, EASE, gsap, shouldAnimate, staggerDelay, useGSAP } from './motion'

/**
 * Brings in the elements that match `selector` inside the returned ref one after the other, when
 * it mounts. To run it again (a new month or currency), remount the component with a `key`.
 */
export function useStaggerIn<T extends HTMLElement>(selector: string) {
  const scope = useRef<T>(null)

  useGSAP(
    () => {
      if (!shouldAnimate()) return
      gsap.fromTo(
        selector,
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: DURATION.medium,
          ease: EASE.emphasized,
          stagger: staggerDelay,
          clearProps: 'opacity,visibility,transform',
        },
      )
    },
    { scope },
  )

  return scope
}
