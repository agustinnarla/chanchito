import { useRef } from 'react'
import { DURATION, EASE, gsap, shouldAnimate, useGSAP } from './motion'

/**
 * Sets a bar's width to `percent`, growing from 0 when it appears and from the width on screen
 * when it changes. The element must start at zero width (`w-0`): the width is set only here.
 */
export function useGrowWidth<T extends HTMLElement>(percent: number) {
  const ref = useRef<T>(null)

  useGSAP(
    () => {
      const width = `${percent}%`
      if (shouldAnimate()) {
        gsap.to(ref.current, {
          width,
          duration: DURATION.long,
          ease: EASE.emphasized,
          overwrite: true,
        })
      } else {
        gsap.set(ref.current, { width })
      }
    },
    { dependencies: [percent] },
  )

  return ref
}
