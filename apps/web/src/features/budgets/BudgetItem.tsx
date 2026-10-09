import { formatBudgetStatus, formatMoney, type BudgetProgress } from '@chanchito/core'
import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS = {
  ok: { Icon: CircleCheck, color: 'text-status-good', bar: 'bg-status-good' },
  warning: { Icon: TriangleAlert, color: 'text-status-warning', bar: 'bg-status-warning' },
  exceeded: { Icon: CircleAlert, color: 'text-status-critical', bar: 'bg-status-critical' },
} as const

/** A budget with what was spent, a progress bar and its status. */
export function BudgetItem({ progress }: { progress: BudgetProgress }) {
  const { budget, spent, ratio, status } = progress
  const { Icon, color, bar } = STATUS[status]
  const percent = Math.min(100, Math.round(ratio * 100))

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="font-medium">
          {budget.category.name}
          {budget.category.archived && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">(archivada)</span>
          )}
        </p>
        <p className="text-sm tabular-nums">
          {formatMoney(spent)} <span className="text-muted-foreground">de</span>{' '}
          {formatMoney(budget.amount)}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={`Gastado en ${budget.category.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${Math.round(ratio * 100)}%`}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn('h-full rounded-full', bar)} style={{ width: `${percent}%` }} />
      </div>
      <p className="flex items-center gap-1.5 text-sm">
        <Icon aria-hidden className={cn('size-4 shrink-0', color)} />
        {formatBudgetStatus(progress)}
      </p>
    </li>
  )
}
