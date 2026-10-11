import {
  sortCategories,
  type Category,
  type CategoryKind,
  type Currency,
  type MovementFilters,
} from '@chanchito/core'
import { useId, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { hasFilters } from './filters'

type Props = {
  filters: MovementFilters
  categories: Category[]
  onChange: (filters: MovementFilters) => void
}

const selectClassName = 'h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs'

export function MovementFiltersBar({ filters, categories, onChange }: Props) {
  const id = useId()
  const options = sortCategories(
    categories.filter((c) => filters.kind === undefined || c.kind === filters.kind),
  )

  function changeKind(value: string) {
    const kind = value === '' ? undefined : (value as CategoryKind)
    const category = categories.find((c) => c.id === filters.categoryId)
    // A category of the other kind would leave nothing to show.
    const categoryId = category && kind && category.kind !== kind ? undefined : filters.categoryId
    onChange({ ...filters, kind, categoryId })
  }

  return (
    <div
      role="group"
      aria-label="Filtros"
      className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_2fr_1fr_auto] sm:items-end"
    >
      <Filter label="Tipo" htmlFor={`${id}-kind`}>
        <select
          id={`${id}-kind`}
          className={selectClassName}
          value={filters.kind ?? ''}
          onChange={(event) => changeKind(event.target.value)}
        >
          <option value="">Todos</option>
          <option value="expense">Gastos</option>
          <option value="income">Ingresos</option>
        </select>
      </Filter>
      <Filter label="Categoría" htmlFor={`${id}-category`}>
        <select
          id={`${id}-category`}
          className={selectClassName}
          value={filters.categoryId ?? ''}
          onChange={(event) =>
            onChange({ ...filters, categoryId: event.target.value || undefined })
          }
        >
          <option value="">Todas</option>
          {options.map((category) => (
            <option key={category.id} value={category.id}>
              {category.archived ? `${category.name} (archivada)` : category.name}
            </option>
          ))}
        </select>
      </Filter>
      <Filter label="Moneda" htmlFor={`${id}-currency`}>
        <select
          id={`${id}-currency`}
          className={selectClassName}
          value={filters.currency ?? ''}
          onChange={(event) =>
            onChange({ ...filters, currency: (event.target.value || undefined) as Currency })
          }
        >
          <option value="">Todas</option>
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
      </Filter>
      <Button variant="ghost" disabled={!hasFilters(filters)} onClick={() => onChange({})}>
        Limpiar filtros
      </Button>
    </div>
  )
}

function Filter({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
