import * as React from 'react'
import { cn } from 'cn'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-12 w-full min-w-0 rounded-[14px] border border-transparent bg-surface px-3.5 py-1 text-base font-medium transition-colors outline-none placeholder:text-muted-foreground placeholder:font-normal focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-[15px]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
