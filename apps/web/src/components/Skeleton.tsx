import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** A placeholder block with the shape of what is loading. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block animate-pulse rounded-full bg-surface-high', className)}
    />
  )
}

type LoadingProps = { label: string; className?: string; children: ReactNode }

/**
 * Placeholders while something loads, announced by `label` ("Cargando movimientos…"). They take
 * about the same room as the content, so it doesn't jump when it arrives.
 */
export function Loading({ label, className, children }: LoadingProps) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

/** Rows shaped like movements or budgets: an emoji tile, two lines and an amount. */
export function SkeletonRows({ count = 4 }: { count?: number }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="flex items-center gap-3.5 px-3 py-2.5">
      <Skeleton className="size-12 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  ))
}
