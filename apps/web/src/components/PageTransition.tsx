import { useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { DURATION, EASE, gsap, shouldAnimate, useGSAP } from '@/lib/motion'

/** Brings the page in when the section changes; changing the month or filters doesn't. */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!shouldAnimate()) return
      gsap.fromTo(
        ref.current,
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: DURATION.medium,
          ease: EASE.emphasized,
          clearProps: 'opacity,visibility,transform',
        },
      )
    },
    { dependencies: [pathname] },
  )

  return <div ref={ref}>{children}</div>
}
