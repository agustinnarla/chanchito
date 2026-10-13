import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * A dialog's buttons, stuck to its bottom edge: they stay in reach when the form is long and
 * the dialog scrolls (a long list of categories, a phone with the keyboard open).
 */
export function DialogActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'sticky bottom-0 -mx-6 -mb-6 flex flex-wrap items-center justify-end gap-2 bg-popover px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
        className,
      )}
      {...props}
    />
  )
}
