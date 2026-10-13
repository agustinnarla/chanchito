import {
  convertMoney,
  formatMoney,
  type Contribution,
  type ExchangeRate,
  type GoalProgress,
} from '@chanchito/core'
import { useState } from 'react'
import { toast } from 'sonner'
import { CategoryEmoji } from '@/components/CategoryEmoji'
import { GrowBar } from '@/components/GrowBar'
import { Icon } from '@/components/Icon'
import { Shaped } from '@/components/Shaped'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ContributionDialog } from './ContributionDialog'
import { ContributionsDialog } from './ContributionsDialog'
import { DeleteGoalDialog } from './DeleteGoalDialog'
import { GoalDialog } from './GoalDialog'
import { useSetGoalArchived } from './hooks'

type Props = {
  progress: GoalProgress
  /** This goal's contributions, newest first. */
  contributions: Contribution[]
  rate: ExchangeRate | null
}

type Open = 'deposit' | 'withdrawal' | 'edit' | 'history' | 'delete' | null

/** A goal: its emoji, what was saved against its target, what's left and its actions. */
export function GoalRow({ progress, contributions, rate }: Props) {
  const { goal, saved, target, remaining, ratio, reached } = progress
  const [open, setOpen] = useState<Open>(null)
  const archive = useSetGoalArchived()
  const percent = ratio === null ? null : Math.round(ratio * 100)
  const converted = goal.target.currency !== goal.savingCurrency
  const remainingInTarget =
    remaining && converted && rate ? convertMoney(remaining, goal.target.currency, rate) : null

  function toggleArchived() {
    archive.mutate(
      { id: goal.id, archived: !goal.archived },
      {
        onSuccess: () => toast.success(goal.archived ? 'Meta restaurada' : 'Meta archivada'),
        onError: (error) => toast.error(error.message),
      },
    )
  }

  const close = (next: boolean) => !next && setOpen(null)

  return (
    <li className="group flex flex-wrap items-center gap-4 rounded-[22px] bg-surface p-3.5">
      <Shaped shape="cookie" className="size-16" shapeClassName="shape-morph bg-surface-high">
        <CategoryEmoji emoji={goal.emoji} className="size-10" />
      </Shaped>

      <div className="min-w-0 flex-[1_1_18rem] space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-[17px] font-semibold">{goal.name}</p>
          <p className="font-mono text-sm">
            {formatMoney(saved)}
            {target && (
              <>
                {' '}
                <span className="text-muted-foreground">de</span> {formatMoney(target)}
              </>
            )}
          </p>
        </div>
        {percent !== null && (
          <div
            role="progressbar"
            aria-label={`Ahorrado para ${goal.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(100, percent)}
            aria-valuetext={`${percent}%`}
            className="h-3 overflow-hidden rounded-full bg-surface-high"
          >
            <GrowBar percent={Math.min(100, percent)} className="bg-primary" />
          </div>
        )}
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
          {percent === null ? (
            <span>No pudimos traer el dólar MEP para comparar con el objetivo.</span>
          ) : reached ? (
            <span className="font-semibold text-foreground">¡Lo lograste! {percent}%</span>
          ) : (
            <span>
              <span className="font-semibold text-foreground">{percent}%</span> · Te faltan{' '}
              {remaining && formatMoney(remaining)}
              {remainingInTarget && ` (${formatMoney(remainingInTarget)})`}
            </span>
          )}
          {converted && rate && (
            <span>
              Meta: {formatMoney(goal.target)} al dólar MEP de hoy,{' '}
              {formatMoney({ amount: rate.rate, currency: 'ARS' })}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {!goal.archived && (
          <Button onClick={() => setOpen('deposit')}>
            <Icon name="add" className="size-5" />
            Aportar
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Acciones de la meta ${goal.name}`}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-high"
          >
            <Icon name="more_vert" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {!goal.archived && saved.amount > 0 && (
              <DropdownMenuItem onSelect={() => setOpen('withdrawal')}>
                <Icon name="remove" />
                Retirar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => setOpen('history')}>
              <Icon name="receipt_long" />
              Ver aportes
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setOpen('edit')}>
              <Icon name="edit" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={toggleArchived}>
              <Icon name={goal.archived ? 'unarchive' : 'archive'} />
              {goal.archived ? 'Restaurar' : 'Archivar'}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setOpen('delete')}>
              <Icon name="delete" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(open === 'deposit' || open === 'withdrawal') && (
        <ContributionDialog open onOpenChange={close} progress={progress} kind={open} rate={rate} />
      )}
      <GoalDialog open={open === 'edit'} onOpenChange={close} goal={goal} />
      <ContributionsDialog
        open={open === 'history'}
        onOpenChange={close}
        goal={goal}
        contributions={contributions}
      />
      <DeleteGoalDialog progress={progress} open={open === 'delete'} onOpenChange={close} />
    </li>
  )
}
