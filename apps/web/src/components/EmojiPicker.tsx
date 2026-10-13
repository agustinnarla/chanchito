import { CATEGORY_EMOJIS } from '@chanchito/core'
import { CategoryEmoji } from '@/components/CategoryEmoji'
import { useRadioKeys } from '@/lib/use-radio-keys'
import { cn } from '@/lib/utils'

type Props = { value: string; onChange: (emoji: string) => void; labelId: string }

/** The curated emojis in a grid, as a radio group named by each emoji's label. */
export function EmojiPicker({ value, onChange, labelId }: Props) {
  const radioKeys = useRadioKeys(
    CATEGORY_EMOJIS.length,
    CATEGORY_EMOJIS.findIndex((e) => e.key === value),
    (index) => {
      const emoji = CATEGORY_EMOJIS[index]
      if (emoji) onChange(emoji.key)
    },
  )

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className="grid max-h-56 grid-cols-6 gap-1.5 overflow-y-auto rounded-[18px] bg-surface p-2 sm:grid-cols-8"
    >
      {CATEGORY_EMOJIS.map((emoji, index) => {
        const checked = emoji.key === value
        return (
          <button
            key={emoji.key}
            {...radioKeys(index)}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={emoji.label}
            title={emoji.label}
            onClick={() => onChange(emoji.key)}
            className={cn(
              'flex aspect-square items-center justify-center rounded-xl transition-colors',
              checked ? 'bg-active ring-2 ring-primary ring-inset' : 'hover:bg-surface-high',
            )}
          >
            <CategoryEmoji emoji={emoji.key} className="size-7" />
          </button>
        )
      })}
    </div>
  )
}
