import { cn } from '@/lib/utils'
import { ICON_PATHS, type IconName } from './icons'

type Props = {
  name: IconName
  /** Filled, like the icon of the active section. */
  filled?: boolean
  className?: string
}

/** A Material Symbols Rounded icon. Decorative: the control next to it carries the label. */
export function Icon({ name, filled = false, className }: Props) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 -960 960 960"
      fill="currentColor"
      className={cn('size-6 shrink-0', className)}
    >
      <path d={ICON_PATHS[name][filled ? 1 : 0]} />
    </svg>
  )
}
