import { formatDate, formatMonthLabel, type Currency } from '@chanchito/core'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AnimatedMoney } from '@/components/AnimatedMoney'
import { Icon } from '@/components/Icon'
import { MonthNavigation } from '@/components/MonthNavigation'
import { Panel } from '@/components/Panel'
import { Segmented } from '@/components/Segmented'
import { StaggerList } from '@/components/StaggerList'
import { Button } from '@/components/ui/button'
import { useMonthSummary } from '@/features/balance/hooks'
import { useMovements } from '@/features/movements/hooks'
import { MovementDialog } from '@/features/movements/MovementDialog'
import { MovementItem } from '@/features/movements/MovementItem'
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
  const [creating, setCreating] = useState(false)
  const monthLabel = formatMonthLabel(month).toLowerCase()

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Inicio</h1>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MonthNavigation month={month} onChange={goToMonth} />
          <Segmented label="Moneda" options={CURRENCIES} value={currency} onChange={setCurrency} />
        </div>

        {summary.isPending ? (
          <p className="mt-8 text-muted-foreground">Cargando balance…</p>
        ) : summary.isError ? (
          <div role="alert" className="mt-8 space-y-2">
            <p className="text-destructive">No se pudo calcular el balance del mes.</p>
            <Button variant="secondary" size="sm" onClick={() => void summary.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="mt-7">
            <dl className="flex flex-wrap gap-3">
              <div className="basis-full">
                <dt className="text-[15px] text-muted-foreground">Resultado del mes</dt>
                <dd className="mt-1 font-mono text-5xl font-medium tracking-tight sm:text-6xl">
                  <AnimatedMoney money={summary.data[currency].net} signed />
                </dd>
              </div>
              <Stat label="Ingresos" icon="south_west" highlight>
                <AnimatedMoney money={summary.data[currency].income} />
              </Stat>
              <Stat label="Gastos" icon="north_east">
                <AnimatedMoney money={summary.data[currency].expense} />
              </Stat>
            </dl>
            <Link
              to={`/balance?mes=${month}`}
              className="mt-5 inline-block text-sm font-semibold text-income hover:underline"
            >
              Ver balance
            </Link>
          </div>
        )}
      </Panel>

      <Panel className="px-3 sm:px-4">
        <div className="flex items-center justify-between px-3 pb-2">
          <h2 className="text-lg font-semibold">Últimos movimientos</h2>
          <Link
            to={`/movimientos?mes=${month}`}
            className="rounded-full bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface-high"
          >
            Ver todos
          </Link>
        </div>
        {movements.isPending ? (
          <p className="px-3 py-4 text-muted-foreground">Cargando movimientos…</p>
        ) : movements.isError ? (
          <p role="alert" className="px-3 py-4 text-destructive">
            No se pudieron cargar los movimientos.
          </p>
        ) : movements.data.length === 0 ? (
          <div className="space-y-3 px-3 py-4">
            <p className="text-muted-foreground">No hay movimientos en {monthLabel}.</p>
            <Button size="sm" onClick={() => setCreating(true)}>
              Cargar el primero
            </Button>
          </div>
        ) : (
          <StaggerList key={month} aria-label={`Últimos movimientos de ${monthLabel}`}>
            {movements.data.slice(0, LATEST_COUNT).map((movement) => (
              <MovementItem
                key={movement.id}
                movement={movement}
                detail={
                  <>
                    <time dateTime={movement.occurredOn}>{formatDate(movement.occurredOn)}</time>
                    {movement.description && <> · {movement.description}</>}
                  </>
                }
              />
            ))}
          </StaggerList>
        )}
      </Panel>

      <MovementDialog open={creating} onOpenChange={setCreating} />
    </div>
  )
}

type StatProps = {
  label: string
  icon: 'south_west' | 'north_east'
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
