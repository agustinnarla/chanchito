import { formatBudgetStatus, formatMoney, type BudgetProgress } from '@chanchito/core'
import { CircleAlert, CircleCheck, Pencil, Trash2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BudgetDialog } from './BudgetDialog'
import { DeleteBudgetDialog } from './DeleteBudgetDialog'
import { CURRENCY_NAME } from './labels'

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
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const describe = `${budget.category.name} en ${CURRENCY_NAME[budget.amount.currency]}`

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
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm">
          <Icon aria-hidden className={cn('size-4 shrink-0', color)} />
          {formatBudgetStatus(progress)}
        </p>
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Editar presupuesto de ${describe}`}
            onClick={() => setEditing(true)}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Eliminar presupuesto de ${describe}`}
            onClick={() => setDeleting(true)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <BudgetDialog open={editing} onOpenChange={setEditing} month={budget.month} budget={budget} />
      <DeleteBudgetDialog budget={budget} open={deleting} onOpenChange={setDeleting} />
    </li>
  )
}
