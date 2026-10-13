import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { Shaped } from '@/components/Shaped'
import { cn } from '@/lib/utils'
import { MovementDialog } from './MovementDialog'

type Props = {
  /** `menu`: wide button in the side menu (icon only when `compact`); `fab`: floating, on phones. */
  variant?: 'menu' | 'fab'
  compact?: boolean
}

export function NewMovementButton({ variant = 'menu', compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const iconOnly = variant === 'fab' || compact

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={iconOnly ? 'Nuevo movimiento' : undefined}
        title={iconOnly ? 'Nuevo movimiento' : undefined}
        className={cn(
          'group flex items-center justify-center gap-2 font-semibold text-primary-foreground transition-[filter,scale] duration-200 ease-standard active:scale-95',
          iconOnly
            ? 'grid place-items-center'
            : 'h-14 rounded-[18px] bg-primary px-4 hover:brightness-110',
          variant === 'fab' &&
            'fixed right-4 bottom-24 z-40 size-16 duration-300 ease-emphasized animate-in fade-in zoom-in-50',
          variant === 'menu' && compact && 'mx-auto size-14',
        )}
      >
        {iconOnly ? (
          // Icon only: on an expressive shape that blooms into a flower on hover (spec 008)
          <Shaped
            shape="cookie"
            className="size-full"
            shapeClassName="shape-morph bg-primary group-hover:rotate-[30deg]"
          >
            <Icon name="add" />
          </Shaped>
        ) : (
          <>
            <Icon name="add" />
            <span className="duration-300 animate-in fade-in">Nuevo movimiento</span>
          </>
        )}
      </button>
      <MovementDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
