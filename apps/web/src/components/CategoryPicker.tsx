import type { Category } from '@chanchito/core'
import { PopEmoji } from '@/components/PopEmoji'
import { Shaped } from '@/components/Shaped'
import { shapeFor } from '@/lib/shapes'
import { useRadioKeys } from '@/lib/use-radio-keys'
import { useStaggerIn } from '@/lib/use-stagger-in'
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
 * between categories and choose them. They come in one after the other when it mounts.
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

  const gridRef = useStaggerIn<HTMLDivElement>(':scope > button')

  return (
    <div>
      <div
        ref={gridRef}
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
                'flex min-h-21 flex-col items-center justify-center gap-1.5 rounded-[18px] px-1.5 py-3 text-[13px] font-medium transition duration-200 ease-standard active:scale-95',
                checked
                  ? 'bg-active text-active-foreground ring-2 ring-primary ring-inset'
                  : 'bg-surface hover:bg-surface-high',
              )}
            >
              {/* The chosen one turns into a flower */}
              <Shaped
                shape={checked ? 'flower' : shapeFor(category.id)}
                className="size-12"
                shapeClassName={checked ? 'bg-primary' : 'bg-surface-high'}
              >
                <PopEmoji emoji={category.emoji} active={checked} className="size-8" />
              </Shaped>
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
