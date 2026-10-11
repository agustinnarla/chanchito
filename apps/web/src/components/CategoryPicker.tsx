import type { Category } from '@chanchito/core'
import { CategoryEmoji } from '@/components/CategoryEmoji'
import { useRadioKeys } from '@/lib/use-radio-keys'
import { cn } from '@/lib/utils'

type Props = {
  /** The categories to offer, already filtered and sorted. */
  categories: Category[]
  value: string
  onChange: (categoryId: string) => void
  labelId: string
  error?: string
  errorId: string
}

/**
 * Pick a category by tapping its emoji. A radio group: Tab enters it, the arrow keys move
 * between categories and choose them.
 */
export function CategoryPicker({ categories, value, onChange, labelId, error, errorId }: Props) {
  const radioKeys = useRadioKeys(
    categories.length,
    categories.findIndex((c) => c.id === value),
    (index) => {
      const category = categories[index]
      if (category) onChange(category.id)
    },
  )

  return (
    <div>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {categories.map((category, index) => {
          const checked = category.id === value
          return (
            <button
              key={category.id}
              {...radioKeys(index)}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(category.id)}
              className={cn(
                'flex min-h-21 flex-col items-center justify-center gap-1.5 rounded-[18px] px-1.5 py-3 text-[13px] font-medium transition-colors',
                checked
                  ? 'bg-active text-active-foreground ring-2 ring-primary ring-inset'
                  : 'bg-surface hover:bg-surface-high',
              )}
            >
              <CategoryEmoji emoji={category.emoji} className="size-8" />
              <span className="line-clamp-2 w-full text-center leading-tight break-words">
                {category.name}
                {category.archived && ' (archivada)'}
              </span>
            </button>
          )
        })}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
