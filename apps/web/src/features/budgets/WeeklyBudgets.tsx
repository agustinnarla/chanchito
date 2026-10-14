import { currentWeek, formatMoney, summarizeWeeklyBudgets, type Currency } from '@chanchito/core'
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { Panel } from '@/components/Panel'
import { Loading, SkeletonRows } from '@/components/Skeleton'
import { StaggerList } from '@/components/StaggerList'
import { Button } from '@/components/ui/button'
import { WeekNavigation } from '@/components/WeekNavigation'
import { useWeekParam } from '@/lib/use-week-param'
import { BudgetDialog } from './BudgetDialog'
import { BudgetItem } from './BudgetItem'
import { useWeekMovements, useWeeklyBudgets } from './hooks'
import { CURRENCY_NAME } from './labels'

const CURRENCIES: Currency[] = ['ARS', 'USD']

/**
 * Weekly budgets (spec 013), above the monthly ones: their progress in the week chosen with its
 * own navigation, which doesn't change the month being viewed.
 */
export function WeeklyBudgets() {
  const [week, goToWeek] = useWeekParam()
  const budgets = useWeeklyBudgets()
  const movements = useWeekMovements(week)
  const [creating, setCreating] = useState(false)

  const summary =
    budgets.data && movements.data
      ? summarizeWeeklyBudgets(budgets.data, movements.data, week)
      : null
  const isCurrent = week === currentWeek()

  return (
    <Panel aria-labelledby="weekly-budgets" className="px-2 sm:px-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-2">
        <div>
          <h2 id="weekly-budgets" className="text-lg font-semibold">
            {isCurrent ? 'Esta semana' : 'Por semana'}
          </h2>
          <WeekNavigation week={week} onChange={goToWeek} />
        </div>
        {budgets.data && budgets.data.length > 0 && (
          <Button variant="secondary" onClick={() => setCreating(true)}>
            <Icon name="add" className="size-5" />
            Nuevo presupuesto semanal
          </Button>
        )}
      </div>

      {budgets.isError || movements.isError ? (
        <div role="alert" className="space-y-2 px-3 pb-2">
          <p className="text-destructive">No se pudieron cargar los presupuestos semanales.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void budgets.refetch()
              movements.refetch()
            }}
          >
            Reintentar
          </Button>
        </div>
      ) : !summary ? (
        <Loading label="Cargando presupuestos semanales…">
          <SkeletonRows count={2} />
        </Loading>
      ) : budgets.data?.length === 0 ? (
        <div className="space-y-3 px-3 pb-2">
          <p className="text-muted-foreground">
            Todavía no tenés presupuestos semanales. Sirven para lo que gastás seguido, como el
            súper.
          </p>
          <Button onClick={() => setCreating(true)}>
            <Icon name="add" className="size-5" />
            Crear uno
          </Button>
        </div>
      ) : (
        CURRENCIES.filter((currency) => summary[currency].progress.length > 0).map((currency) => (
          <div key={currency} className="pt-1">
            <p className="px-3 pb-1 text-sm text-muted-foreground">
              Gastado en {CURRENCY_NAME[currency]}:{' '}
              <span className="font-mono whitespace-nowrap text-foreground">
                {formatMoney(summary[currency].spent)}
              </span>{' '}
              de{' '}
              <span className="font-mono whitespace-nowrap">
                {formatMoney(summary[currency].budgeted)}
              </span>
            </p>
            <StaggerList
              key={`${week}-${currency}`}
              aria-label={`Presupuestos semanales en ${CURRENCY_NAME[currency]}`}
            >
              {summary[currency].progress.map((progress) => (
                <BudgetItem key={progress.budget.id} progress={progress} period="week" />
              ))}
            </StaggerList>
          </div>
        ))
      )}

      <BudgetDialog open={creating} onOpenChange={setCreating} period="week" />
    </Panel>
  )
}
