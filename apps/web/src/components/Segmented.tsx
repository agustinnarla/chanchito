import { cn } from '@/lib/utils'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** A pill-shaped single choice (ARS | USD, Gasto | Ingreso), announced as a radio group. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
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
              'h-10 min-w-16 flex-1 rounded-full px-4 text-sm font-semibold transition duration-200 ease-standard active:scale-95',
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
