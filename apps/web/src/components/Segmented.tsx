import { cn } from '@/lib/utils'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  /** `sm`: narrower options, to fit next to an input. */
  size?: 'default' | 'sm'
  className?: string
}

/** A pill-shaped single choice (ARS | USD, Gasto | Ingreso), announced as a radio group. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  size = 'default',
  className,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex rounded-full bg-surface-high p-1', className)}
    >
      {options.map((option) => {
        const checked = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(option.value)}
            className={cn(
              // Grow from their text, never under it: a long label ("Ahorro e inversión") stays whole
              'flex-[1_0_auto] rounded-full font-semibold whitespace-nowrap transition duration-200 ease-standard active:scale-95',
              size === 'sm' ? 'h-9 min-w-12 px-3 text-[13px]' : 'h-10 min-w-16 px-4 text-sm',
              checked
                ? 'bg-active text-active-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
