import {
  currentMonth,
  filterMovements,
  formatMonthLabel,
  parseMonth,
  type Month,
  type MovementFilters,
} from '@chanchito/core'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/features/categories/hooks'
import { hasFilters, readFilters, writeFilters } from './filters'
import { useMovements } from './hooks'
import { MonthNavigation } from './MonthNavigation'
import { MovementFiltersBar } from './MovementFiltersBar'
import { MovementList } from './MovementList'

export const MONTH_PARAM = 'mes'

export function MovementsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const month = parseMonth(searchParams.get(MONTH_PARAM), currentMonth())
  const movements = useMovements(month)
  const categories = useCategories()
  const filters = readFilters(searchParams, categories.data ?? [])
  const monthLabel = formatMonthLabel(month).toLowerCase()

  function goToMonth(next: Month) {
    setSearchParams((params) => {
      params.set(MONTH_PARAM, next)
      return params
    })
  }

  function changeFilters(next: MovementFilters) {
    setSearchParams((params) => writeFilters(params, next))
  }

  const visible = movements.data ? filterMovements(movements.data, filters) : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Movimientos</h1>
      <MonthNavigation month={month} onChange={goToMonth} />
      <MovementFiltersBar
        filters={filters}
        categories={categories.data ?? []}
        onChange={changeFilters}
      />
      {movements.isPending ? (
        <p className="text-muted-foreground">Cargando movimientos…</p>
      ) : movements.isError ? (
        <div role="alert" className="space-y-2">
          <p className="text-destructive">No se pudieron cargar los movimientos.</p>
          <Button variant="outline" size="sm" onClick={() => void movements.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : movements.data.length === 0 ? (
        <p className="text-muted-foreground">No hay movimientos en {monthLabel}.</p>
      ) : visible.length === 0 && hasFilters(filters) ? (
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Ningún movimiento de {monthLabel} coincide con los filtros.
          </p>
          <Button variant="outline" size="sm" onClick={() => changeFilters({})}>
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <MovementList label={`Movimientos de ${monthLabel}`} movements={visible} />
      )}
    </div>
  )
}
