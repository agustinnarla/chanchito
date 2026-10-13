import { useEffect, useRef } from 'react'
import { DURATION, EASE, gsap, shouldAnimate } from './motion'

/**
 * Smooths height changes: when the content inside `inner` grows or shrinks (another category
 * list, an error, data that arrived), `outer` goes from its old height to the new one instead of
 * jumping. The first measure only records the height.
 */
export function useAutoHeight<Outer extends HTMLElement, Inner extends HTMLElement>() {
  const outer = useRef<Outer>(null)
  const inner = useRef<Inner>(null)

  useEffect(() => {
    const target = inner.current
    if (!target || !shouldAnimate()) return
    let previous: number | null = null
    const observer = new ResizeObserver(([entry]) => {
      const height = entry?.borderBoxSize[0]?.blockSize ?? target.offsetHeight
      if (previous !== null && Math.abs(height - previous) > 1) {
        // `clip` and not `hidden`: it doesn't make a scroll container, so sticky actions still work
        gsap.fromTo(
          outer.current,
          { height: previous, overflow: 'clip' },
          {
            height,
            duration: DURATION.medium,
            ease: EASE.emphasized,
            overwrite: true,
            clearProps: 'height,overflow',
          },
        )
      }
      previous = height
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return { outer, inner }
}
