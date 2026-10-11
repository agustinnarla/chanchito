import type { Category } from '@chanchito/core'
import { useRef, type KeyboardEvent } from 'react'
import { CategoryEmoji } from '@/components/CategoryEmoji'
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
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const selected = categories.findIndex((c) => c.id === value)
  const focusable = selected === -1 ? 0 : selected

  function handleKeyDown(event: KeyboardEvent, index: number) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (step === undefined) return
    event.preventDefault()
    const next = (index + step + categories.length) % categories.length
    const category = categories[next]
    if (!category) return
    onChange(category.id)
    refs.current[next]?.focus()
  }

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
              ref={(element) => {
                refs.current[index] = element
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={index === focusable ? 0 : -1}
              onClick={() => onChange(category.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
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
