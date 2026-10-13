import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { cn } from '@/lib/utils'
import { AppearanceDialog } from './AppearanceDialog'

type Props = { showLabel?: boolean; className?: string }

/** Opens the appearance dialog: theme and color (spec 011). Replaces the theme toggle. */
export function AppearanceButton({ showLabel = false, className }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={showLabel ? undefined : 'Apariencia'}
        title={showLabel ? undefined : 'Apariencia'}
        className={cn(
          'flex h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-surface-high px-3 text-sm font-medium transition-[filter] hover:brightness-110',
          className,
        )}
      >
        <Icon name="palette" className="size-5" />
        {showLabel && <span className="duration-300 animate-in fade-in">Apariencia</span>}
      </button>
      <AppearanceDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
