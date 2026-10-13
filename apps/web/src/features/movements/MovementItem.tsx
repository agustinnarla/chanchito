import { formatMovementAmount, type Movement } from '@chanchito/core'
import type { ReactNode } from 'react'
import { CategoryEmoji } from '@/components/CategoryEmoji'
import { Shaped } from '@/components/Shaped'
import { cn } from '@/lib/utils'

type Props = {
  movement: Movement
  /** Secondary line: the date, the description or both. */
  detail: ReactNode
  /** Buttons at the end of the row, like the actions menu. */
  actions?: ReactNode
}

/** A movement as a row: its category's emoji, name, detail and signed amount. */
export function MovementItem({ movement, detail, actions }: Props) {
  const { category } = movement
  return (
    <li className="group flex items-center gap-3.5 rounded-[20px] px-3 py-2.5 sm:px-3.5">
      <Shaped shape="cookie" className="size-12" shapeClassName="shape-morph bg-surface">
        <CategoryEmoji emoji={category.emoji} />
      </Shaped>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">
          {category.name}
          {category.archived && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">(archivada)</span>
          )}
        </p>
        <p className="truncate text-sm text-muted-foreground">{detail}</p>
      </div>
      <p
        className={cn(
          'font-mono text-[15px] font-medium whitespace-nowrap',
          category.kind === 'income' && 'text-income',
        )}
      >
        {formatMovementAmount(movement)}
      </p>
      {actions}
    </li>
  )
}
