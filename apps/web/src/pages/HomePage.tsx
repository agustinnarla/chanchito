import {
  formatDate,
  formatMonthLabel,
  formatMonthName,
  monthMood,
  investedThisMonth,
  savedThisMonth,
  summarizeBudgets,
  type Currency,
} from '@chanchito/core'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AnimatedMoney } from '@/components/AnimatedMoney'
import { CategoryEmoji } from '@/components/CategoryEmoji'
import { Icon } from '@/components/Icon'
import { MonthNavigation } from '@/components/MonthNavigation'
import { Panel } from '@/components/Panel'
import { Segmented } from '@/components/Segmented'
import { Loading, Skeleton, SkeletonRows } from '@/components/Skeleton'
import { Shaped } from '@/components/Shaped'
import { StaggerList } from '@/components/StaggerList'
import { Button } from '@/components/ui/button'
import { useMonthSummary } from '@/features/balance/hooks'
import { useBudgets } from '@/features/budgets/hooks'
import { BudgetsGlance } from '@/features/mood/BudgetsGlance'
import { MoodGreeting } from '@/features/mood/MoodGreeting'
import { moodLook } from '@/features/mood/tone'
import { useMovements } from '@/features/movements/hooks'
import { MovementDialog } from '@/features/movements/MovementDialog'
import { MovementItem } from '@/features/movements/MovementItem'
import { usePurchases } from '@/features/investments/hooks'
import { useContributions } from '@/features/savings/hooks'
import { useMonthParam } from '@/lib/use-month-param'
import { cn } from '@/lib/utils'

const CURRENCIES = [
  { value: 'ARS', label: 'ARS' },
  { value: 'USD', label: 'USD' },
] as const

const LATEST_COUNT = 6

export function HomePage() {
  const [month, goToMonth] = useMonthParam()
  const [currency, setCurrency] = useState<Currency>('ARS')
  const summary = useMonthSummary(month)
  const movements = useMovements(month)
  const budgets = useBudgets(month)
  const contributions = useContributions()
  const purchases = usePurchases()
  const [creating, setCreating] = useState(false)
  const monthLabel = formatMonthLabel(month).toLowerCase()

  // The month's mood in the chosen currency (spec 008). Budgets refine it once they arrive.
  const progress =
    movements.data && budgets.data
      ? summarizeBudgets(budgets.data, movements.data, month)[currency].progress
      : []
  // Put into savings goals this month (spec 009); refines the mood once it arrives
  const saved = contributions.data ? savedThisMonth(contributions.data, month)[currency] : undefined
  const invested = purchases.data ? investedThisMonth(purchases.data, month)[currency] : undefined
  const mood =
    summary.data && movements.data
      ? monthMood({
          hasMovements: movements.data.length > 0,
          summary: summary.data[currency],
          budgets: progress,
          saved,
          invested,
        })
      : null
  const look = mood && moodLook(mood)
  const isEmpty = mood?.kind === 'empty'

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Inicio</h1>

      {mood ? (
        <MoodGreeting mood={mood} month={month} />
      ) : (
        <div aria-hidden="true" className="flex items-center gap-4 px-1 py-1 sm:gap-5 sm:px-2">
          <Skeleton className="size-20 sm:size-24" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-3/4 max-w-md" />
          </div>
        </div>
      )}

      <Panel data-tone={look?.tone ?? 'neutral'} className="mood-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MonthNavigation month={month} onChange={goToMonth} />
          {!isEmpty && (
            <Segmented
              label="Moneda"
              options={CURRENCIES}
              value={currency}
              onChange={setCurrency}
            />
          )}
        </div>

        {summary.isPending ? (
          <Loading label="Cargando balance…" className="mt-7 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-64 sm:h-14" />
            <div className="flex flex-wrap gap-3 pt-1">
              <Skeleton className="h-16 w-44 rounded-[20px]" />
              <Skeleton className="h-16 w-44 rounded-[20px]" />
            </div>
          </Loading>
        ) : summary.isError ? (
          <div role="alert" className="mt-8 space-y-2">
            <p className="text-destructive">No se pudo calcular el balance del mes.</p>
            <Button variant="secondary" size="sm" onClick={() => void summary.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : isEmpty ? (
          <EmptyMonth month={month} onCreate={() => setCreating(true)} />
        ) : (
          <div className="mt-7 duration-300 animate-in fade-in">
            {/* The mood's chip is its own term ("Estado"); the grid puts it next to the result's label */}
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5">
              <dt className="row-start-1 text-[15px] text-muted-foreground">Resultado del mes</dt>
              <dd className="col-span-2 row-start-2 mt-1 font-mono text-5xl font-medium tracking-tight text-tone-strong transition-colors duration-500 sm:text-6xl">
                <AnimatedMoney money={summary.data[currency].net} signed />
              </dd>
              {look?.chip && (
                <>
                  <dt className="sr-only">Estado</dt>
                  <dd
                    key={look.chip.label}
                    className="col-start-2 row-start-1 inline-flex items-center gap-1 justify-self-start rounded-full bg-tone-chip py-1 pr-2.5 pl-1.5 text-[13px] font-semibold text-tone-on-chip duration-300 animate-in fade-in zoom-in-90"
                  >
                    <Icon name={look.chip.icon} className="size-[18px]" />
                    {look.chip.label}
                  </dd>
                </>
              )}
            </dl>
            <dl className="mt-6 flex flex-wrap gap-3">
              <Stat label="Ingresos" icon="south_west" highlight>
                <AnimatedMoney money={summary.data[currency].income} />
              </Stat>
              <Stat label="Gastos" icon="north_east">
                <AnimatedMoney money={summary.data[currency].expense} />
              </Stat>
              {saved && saved.amount > 0 && (
                <Stat label="Ahorraste" icon="savings">
                  <AnimatedMoney money={saved} />
                </Stat>
              )}
              {invested && invested.amount > 0 && (
                <Stat label="Invertiste" icon="trending_up">
                  <AnimatedMoney money={invested} />
                </Stat>
              )}
            </dl>
            <Link
              viewTransition
              to={`/balance?mes=${month}`}
              className="mt-5 inline-block text-sm font-semibold text-income hover:underline"
            >
              Ver balance
            </Link>
          </div>
        )}
      </Panel>

      {!isEmpty && (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Panel className="px-3 sm:px-4">
            <div className="flex items-center justify-between px-3 pb-2">
              <h2 className="text-lg font-semibold">Últimos movimientos</h2>
              <Link
                viewTransition
                to={`/movimientos?mes=${month}`}
                className="rounded-full bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface-high"
              >
                Ver todos
              </Link>
            </div>
            {movements.isPending ? (
              <Loading label="Cargando movimientos…">
                <SkeletonRows count={LATEST_COUNT} />
              </Loading>
            ) : movements.isError ? (
              <p role="alert" className="px-3 py-4 text-destructive">
                No se pudieron cargar los movimientos.
              </p>
            ) : (
              <StaggerList key={month} aria-label={`Últimos movimientos de ${monthLabel}`}>
                {movements.data.slice(0, LATEST_COUNT).map((movement) => (
                  <MovementItem
                    key={movement.id}
                    movement={movement}
                    detail={
                      <>
                        <time dateTime={movement.occurredOn}>
                          {formatDate(movement.occurredOn)}
                        </time>
                        {movement.description && <> · {movement.description}</>}
                      </>
                    }
                  />
                ))}
              </StaggerList>
            )}
          </Panel>
          <BudgetsGlance progress={progress} month={month} />
        </div>
      )}

      <MovementDialog open={creating} onOpenChange={setCreating} />
    </div>
  )
}

type StatProps = {
  label: string
  icon: 'south_west' | 'north_east' | 'savings' | 'trending_up'
  highlight?: boolean
  children: ReactNode
}

/** An amount with its label in a tonal chip. */
function Stat({ label, icon, highlight = false, children }: StatProps) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-surface py-3 pr-5 pl-3">
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-[14px]',
          highlight ? 'bg-active text-active-foreground' : 'bg-surface-high',
        )}
      >
        <Icon name={icon} className="size-5" />
      </span>
      <div>
        <dt className="text-[13px] text-muted-foreground">{label}</dt>
        <dd className="font-mono text-[17px] font-medium">{children}</dd>
      </div>
    </div>
  )
}

const IDEAS = [
  { emoji: 'briefcase', text: 'Cargá tu sueldo del mes' },
  { emoji: 'house', text: 'Sumá los gastos fijos, como el alquiler' },
  { emoji: 'shopping_cart', text: 'Poné un presupuesto para el súper' },
] as const

/** A month without movements: a friendly way in instead of empty figures (spec 008). */
function EmptyMonth({ month, onCreate }: { month: string; onCreate: () => void }) {
  return (
    <div className="mt-6 space-y-5 duration-300 animate-in fade-in">
      <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
        Cuando cargues tu primer movimiento, acá vas a ver cómo viene {formatMonthName(month)}.
      </p>
      <Button onClick={onCreate}>
        <Icon name="add" className="size-5" />
        Cargar el primero
      </Button>
      <div>
        <h2 className="mb-1 text-[15px] font-semibold">Ideas para empezar</h2>
        <ul>
          {IDEAS.map((idea) => (
            <li key={idea.emoji} className="flex items-center gap-3 py-1.5 text-sm">
              <Shaped shape="cookie" className="size-10" shapeClassName="bg-surface">
                <CategoryEmoji emoji={idea.emoji} className="size-6" />
              </Shaped>
              {idea.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
