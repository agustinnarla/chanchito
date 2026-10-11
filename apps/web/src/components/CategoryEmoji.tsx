import { resolveCategoryEmoji } from '@chanchito/core'
import { cn } from '@/lib/utils'

type Props = { emoji: string; className?: string }

/**
 * A category's Fluent Emoji 3D image. Decorative: the category's name is always next to it.
 * Unknown keys show the default emoji.
 */
export function CategoryEmoji({ emoji, className }: Props) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}emoji/${resolveCategoryEmoji(emoji)}.webp`}
      alt=""
      width={96}
      height={96}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn('size-7 shrink-0 select-none', className)}
    />
  )
}
