import { formatBudgetStatus, formatMoney, type BudgetProgress } from '@chanchito/core'
import { useState } from 'react'
import { CategoryEmoji } from '@/components/CategoryEmoji'
import { Icon } from '@/components/Icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { BudgetDialog } from './BudgetDialog'
import { DeleteBudgetDialog } from './DeleteBudgetDialog'
import { CURRENCY_NAME } from './labels'

const STATUS = {
  ok: { icon: 'check_circle', color: 'text-status-good', bar: 'bg-status-good' },
  warning: { icon: 'warning', color: 'text-status-warning', bar: 'bg-status-warning' },
  exceeded: { icon: 'error', color: 'text-status-critical', bar: 'bg-status-critical' },
} as const

/** A budget with its emoji, what was spent, a progress bar, its status and its actions. */
export function BudgetItem({ progress }: { progress: BudgetProgress }) {
  const { budget, spent, ratio, status } = progress
  const { icon, color, bar } = STATUS[status]
  const percent = Math.min(100, Math.round(ratio * 100))
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const describe = `${budget.category.name} en ${CURRENCY_NAME[budget.amount.currency]}`

  return (
    <li className="flex items-center gap-3.5 rounded-[20px] px-3 py-3.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface">
        <CategoryEmoji emoji={budget.category.emoji} />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-[15px] font-semibold">
            {budget.category.name}
            {budget.category.archived && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">(archivada)</span>
            )}
          </p>
          <p className="font-mono text-sm">
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
          className="h-2.5 overflow-hidden rounded-full bg-surface-high"
        >
          <div className={cn('h-full rounded-full', bar)} style={{ width: `${percent}%` }} />
        </div>
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Icon name={icon} filled className={cn('size-[18px]', color)} />
          {formatBudgetStatus(progress)}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Acciones del presupuesto de ${describe}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface"
        >
          <Icon name="more_vert" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Icon name="edit" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
            <Icon name="delete" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <BudgetDialog open={editing} onOpenChange={setEditing} month={budget.month} budget={budget} />
      <DeleteBudgetDialog budget={budget} open={deleting} onOpenChange={setDeleting} />
    </li>
  )
}
