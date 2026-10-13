import { useGrowWidth } from '@/lib/use-grow-width'
import { cn } from '@/lib/utils'

/** The filled part of a bar, growing to `percent` of its track. */
export function GrowBar({ percent, className }: { percent: number; className?: string }) {
  const ref = useGrowWidth<HTMLSpanElement>(percent)
  return <span ref={ref} className={cn('block h-full w-0 rounded-full', className)} />
}
