import { formatDate, formatMovementAmount, type Movement } from '@chanchito/core'
import { cn } from '@/lib/utils'

type Props = { label: string; movements: Movement[] }

export function MovementList({ label, movements }: Props) {
  return (
    <ul aria-label={label} className="divide-y rounded-lg border">
      {movements.map((movement) => (
        <MovementRow key={movement.id} movement={movement} />
      ))}
    </ul>
  )
}

function MovementRow({ movement }: { movement: Movement }) {
  const { category } = movement

  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {category.name}
          {category.archived && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">(archivada)</span>
          )}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          <time dateTime={movement.occurredOn}>{formatDate(movement.occurredOn)}</time>
          {movement.description && <> · {movement.description}</>}
        </p>
      </div>
      <p
        className={cn(
          'font-semibold tabular-nums whitespace-nowrap',
          category.kind === 'income' ? 'text-emerald-700' : 'text-foreground',
        )}
      >
        {formatMovementAmount(movement)}
      </p>
    </li>
  )
}
