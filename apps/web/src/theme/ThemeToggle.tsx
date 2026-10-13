import { Icon } from '@/components/Icon'
import { cn } from '@/lib/utils'
import { useTheme } from './theme-context'

type Props = { showLabel?: boolean; className?: string }

/** Switches between light and dark; the choice is remembered. */
export function ThemeToggle({ showLabel = false, className }: Props) {
  const { theme, toggleTheme } = useTheme()
  const toDark = theme === 'light'
  const label = toDark ? 'Tema oscuro' : 'Tema claro'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={showLabel ? undefined : `Cambiar a ${label.toLowerCase()}`}
      className={cn(
        'flex h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-surface-high px-3 text-sm font-medium transition-[filter] hover:brightness-110',
        className,
      )}
    >
      <Icon name={toDark ? 'dark_mode' : 'light_mode'} className="size-5" />
      {showLabel && <span>{label}</span>}
    </button>
  )
}
