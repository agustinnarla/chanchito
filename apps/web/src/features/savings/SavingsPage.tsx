import {
  formatMoney,
  goalProgress,
  savedByCurrency,
  type Contribution,
  type Currency,
  type ExchangeRate,
  type GoalProgress,
} from '@chanchito/core'
import { useId, useState } from 'react'
import { Icon } from '@/components/Icon'
import { Panel } from '@/components/Panel'
import { Loading, Skeleton, SkeletonRows } from '@/components/Skeleton'
import { StaggerList } from '@/components/StaggerList'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMepRate } from './exchange-rate'
import { formatUpdatedAt } from '@/lib/format-updated-at'
import { GoalDialog } from './GoalDialog'
import { GoalRow } from './GoalRow'
import { useContributions, useGoals } from './hooks'

const SAVED_LABEL: Record<Currency, string> = {
  ARS: 'Guardado en pesos',
  USD: 'Guardado en dólares',
}

/** Savings goals (spec 009): what's saved per currency and each goal's progress. */
export function SavingsPage() {
  const goals = useGoals()
  const contributions = useContributions()
  const mep = useMepRate()
  const [creating, setCreating] = useState(false)

  const ready = goals.data && contributions.data
  const progress = ready
    ? goals.data.map((goal) => goalProgress(goal, contributions.data, mep.rate))
    : []
  const active = progress.filter((p) => !p.goal.archived)
  const archived = progress.filter((p) => p.goal.archived)
  const totals = contributions.data ? savedByCurrency(contributions.data) : null
  const currencies = [...new Set(goals.data?.map((g) => g.savingCurrency))].sort()
  const needsRate = active.some((p) => p.goal.target.currency !== p.goal.savingCurrency)
  const ofGoal = (id: string) => contributions.data?.filter((c) => c.goalId === id) ?? []

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Ahorros</h1>
          <Button variant="secondary" onClick={() => setCreating(true)}>
            <Icon name="flag" className="size-5" />
            Nueva meta
          </Button>
        </div>
        {totals && currencies.length > 0 && (
          <dl className="mt-5 flex flex-wrap gap-3">
            {currencies.map((currency) => (
              <div key={currency} className="min-w-56 rounded-[20px] bg-surface px-5 py-3.5">
                <dt className="text-[13px] text-muted-foreground">{SAVED_LABEL[currency]}</dt>
                <dd className="mt-1 font-mono text-2xl font-medium tracking-tight">
                  {formatMoney(totals[currency])}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Panel>

      <Panel aria-labelledby="metas" className="px-3 sm:px-4">
        <h2 id="metas" className="px-3 pb-3 text-lg font-semibold">
          Metas
        </h2>
        {goals.isError || contributions.isError ? (
          <div role="alert" className="space-y-2 px-3">
            <p className="text-destructive">No se pudieron cargar tus ahorros.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void goals.refetch()
                void contributions.refetch()
              }}
            >
              Reintentar
            </Button>
          </div>
        ) : !ready ? (
          <Loading label="Cargando ahorros…">
            <SkeletonRows count={2} />
          </Loading>
        ) : active.length === 0 ? (
          <div className="space-y-3 px-3 pb-2">
            <p className="text-muted-foreground">
              Todavía no tenés metas. Creá una para juntar plata para algo concreto.
            </p>
            <Button onClick={() => setCreating(true)}>
              <Icon name="flag" className="size-5" />
              Crear una meta
            </Button>
          </div>
        ) : (
          <StaggerList aria-label="Metas de ahorro" className="space-y-2">
            {active.map((p) => (
              <GoalRow
                key={p.goal.id}
                progress={p}
                contributions={ofGoal(p.goal.id)}
                rate={mep.rate}
              />
            ))}
          </StaggerList>
        )}
        {needsRate && mep.rate && (
          <p className="mt-3 flex items-center gap-1.5 px-3 text-xs text-muted-foreground">
            <Icon name="schedule" className="size-4" />
            {mep.isStale
              ? 'Usamos el último dólar MEP que conseguimos, '
              : 'Dólar MEP actualizado '}
            {formatUpdatedAt(mep.rate.at)}.
          </p>
        )}
        {mep.isPending && needsRate && <Skeleton className="mx-3 mt-3 h-3 w-56" />}
      </Panel>

      {archived.length > 0 && <ArchivedGoals progress={archived} ofGoal={ofGoal} rate={mep.rate} />}

      <GoalDialog open={creating} onOpenChange={setCreating} />
    </div>
  )
}

type ArchivedGoalsProps = {
  progress: GoalProgress[]
  ofGoal: (id: string) => Contribution[]
  rate: ExchangeRate | null
}

/** Archived goals, folded away: they still count in what's saved. */
function ArchivedGoals({ progress, ofGoal, rate }: ArchivedGoalsProps) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  return (
    <Panel aria-label="Metas archivadas" className="px-3 py-2 sm:px-3 sm:py-2">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen(!open)}
          className="flex h-13 w-full items-center justify-between rounded-2xl px-3 text-[15px] font-medium text-muted-foreground hover:bg-surface"
        >
          Archivadas ({progress.length})
          <Icon
            name="keyboard_arrow_down"
            className={cn('transition-transform duration-300 ease-standard', open && 'rotate-180')}
          />
        </button>
      </h2>
      {open && (
        <ul
          id={listId}
          className="space-y-2 px-1 pb-2 duration-300 ease-emphasized animate-in fade-in"
        >
          {progress.map((p) => (
            <GoalRow key={p.goal.id} progress={p} contributions={ofGoal(p.goal.id)} rate={rate} />
          ))}
        </ul>
      )}
    </Panel>
  )
}
