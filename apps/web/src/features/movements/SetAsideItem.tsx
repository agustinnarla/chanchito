import { formatBtc, formatEntryAmount, type MonthEntry } from '@chanchito/core'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { CategoryEmoji } from '@/components/CategoryEmoji'
import { Icon } from '@/components/Icon'
import { Shaped } from '@/components/Shaped'

const COIN = `${import.meta.env.BASE_URL}mood/coin.webp`

type Props = {
  entry: Exclude<MonthEntry, { kind: 'movement' }>
  /** Secondary line, like the date; by default, what it is. */
  detail?: ReactNode
}

/**
 * Money put into or out of a goal, or bitcoin bought (spec 012): set aside, not spent. It's
 * edited in Ahorros, so the row links there instead of having its own actions.
 */
export function SetAsideItem({ entry, detail }: Props) {
  const title =
    entry.kind === 'investment'
      ? 'Inversión · Bitcoin'
      : `${entry.contribution.amount.amount > 0 ? 'Ahorro' : 'Retiro'} · ${entry.goal.name}`
  const what =
    entry.kind === 'investment'
      ? `${formatBtc(entry.purchase.quantity)} en ${entry.purchase.platform}`
      : 'Meta de ahorro'

  return (
    <li className="group flex items-center gap-3.5 rounded-[20px] px-3 py-2.5 sm:px-3.5">
      <Shaped shape="cookie" className="size-12" shapeClassName="shape-morph bg-surface">
        {entry.kind === 'investment' ? (
          <img src={COIN} alt="" className="size-7" />
        ) : (
          <CategoryEmoji emoji={entry.goal.emoji} />
        )}
      </Shaped>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{detail ?? what}</p>
      </div>
      <p className="font-mono text-[15px] font-medium whitespace-nowrap text-muted-foreground">
        {formatEntryAmount(entry)}
      </p>
      <Link
        viewTransition
        to="/ahorros"
        aria-label={`Ver ${title} en Ahorros`}
        title="Ver en Ahorros"
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface"
      >
        <Icon name="savings" />
      </Link>
    </li>
  )
}
