import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** A tonal panel: the app's main surface, told apart from the background by color only. */
export function Panel({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section className={cn('rounded-[28px] bg-surface-low p-5 sm:p-6', className)} {...props} />
  )
}
