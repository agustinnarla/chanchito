import { CategoryEmoji } from '@/components/CategoryEmoji'
import { usePop } from '@/lib/use-pop'

type Props = { emoji: string; active: boolean; className?: string }

/** A category emoji in a picker, which pops when it's chosen. */
export function PopEmoji({ emoji, active, className }: Props) {
  const ref = usePop<HTMLImageElement>(active)
  return <CategoryEmoji ref={ref} emoji={emoji} className={className} />
}
