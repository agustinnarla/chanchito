import type { ReactNode } from 'react'
import { useAutoHeight } from '@/lib/use-auto-height'

/** Its height follows the content smoothly instead of jumping. */
export function AutoHeight({ className, children }: { className?: string; children: ReactNode }) {
  const { outer, inner } = useAutoHeight<HTMLDivElement, HTMLDivElement>()
  return (
    <div ref={outer}>
      <div ref={inner} className={className}>
        {children}
      </div>
    </div>
  )
}
