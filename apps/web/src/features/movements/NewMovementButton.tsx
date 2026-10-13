import { useState } from 'react'
import { Icon } from '@/components/Icon'
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
          'flex items-center justify-center gap-2 bg-primary font-semibold text-primary-foreground transition-[filter,scale] duration-200 ease-standard hover:brightness-110 active:scale-95',
          variant === 'fab'
            ? 'fixed right-4 bottom-24 z-40 size-14 rounded-2xl shadow-lg duration-300 ease-emphasized animate-in fade-in zoom-in-50'
            : 'h-14 rounded-[18px] px-4',
        )}
      >
        <Icon name="add" />
        {!iconOnly && <span className="duration-300 animate-in fade-in">Nuevo movimiento</span>}
      </button>
      <MovementDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
