import { filterEntries, formatMonthLabel, type MovementFilters } from '@chanchito/core'
import { useSearchParams } from 'react-router'
import { MonthNavigation } from '@/components/MonthNavigation'
import { Panel } from '@/components/Panel'
import { Loading, SkeletonRows } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/features/categories/hooks'
import { useMonthParam } from '@/lib/use-month-param'
import { hasFilters, readFilters, writeFilters } from './filters'
import { MovementFiltersBar } from './MovementFiltersBar'
import { MovementList } from './MovementList'
import { useMonthEntries } from './use-month-entries'

export function MovementsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [month, goToMonth] = useMonthParam()
  const movements = useMonthEntries(month)
  const categories = useCategories()
  const filters = readFilters(searchParams, categories.data ?? [])
  const monthLabel = formatMonthLabel(month).toLowerCase()

  function changeFilters(next: MovementFilters) {
    setSearchParams((params) => writeFilters(params, next))
  }

  const visible = movements.entries ? filterEntries(movements.entries, filters) : []

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Movimientos</h1>
      <Panel className="space-y-4">
        <MonthNavigation month={month} onChange={goToMonth} />
        <MovementFiltersBar
          filters={filters}
          categories={categories.data ?? []}
          onChange={changeFilters}
        />
      </Panel>
      <Panel className="px-2 sm:px-3">
        {movements.isPending ? (
          <Loading label="Cargando movimientos…">
            <SkeletonRows count={6} />
          </Loading>
        ) : movements.isError ? (
          <div role="alert" className="space-y-2 px-3">
            <p className="text-destructive">No se pudieron cargar los movimientos.</p>
            <Button variant="secondary" size="sm" onClick={() => void movements.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : movements.entries?.length === 0 ? (
          <p className="px-3 text-muted-foreground">No hay movimientos en {monthLabel}.</p>
        ) : visible.length === 0 && hasFilters(filters) ? (
          <div className="space-y-2 px-3">
            <p className="text-muted-foreground">
              Ningún movimiento de {monthLabel} coincide con los filtros.
            </p>
            <Button variant="secondary" size="sm" onClick={() => changeFilters({})}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <MovementList key={month} label={`Movimientos de ${monthLabel}`} entries={visible} />
        )}
      </Panel>
    </div>
  )
}
