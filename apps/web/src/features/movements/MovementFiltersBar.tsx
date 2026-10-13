import { sortCategories, type Category, type Currency, type MovementFilters } from '@chanchito/core'
import { useId, type ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import { Segmented } from '@/components/Segmented'
import { Button } from '@/components/ui/button'
import { hasFilters } from './filters'

type Props = {
  filters: MovementFilters
  categories: Category[]
  onChange: (filters: MovementFilters) => void
}

type KindOption = NonNullable<MovementFilters['kind']> | 'all'

const KIND_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'set-aside', label: 'Ahorro e inversión' },
] as const satisfies readonly { value: KindOption; label: string }[]

export function MovementFiltersBar({ filters, categories, onChange }: Props) {
  const id = useId()
  const options = sortCategories(
    categories.filter((c) => filters.kind === undefined || c.kind === filters.kind),
  )

  function changeKind(value: KindOption) {
    const kind = value === 'all' ? undefined : value
    const category = categories.find((c) => c.id === filters.categoryId)
    // A category of the other kind would leave nothing to show; savings have no category.
    const categoryId = category && kind && category.kind !== kind ? undefined : filters.categoryId
    onChange({ ...filters, kind, categoryId })
  }

  return (
    <div role="group" aria-label="Filtros" className="flex flex-wrap items-center gap-2">
      <Segmented
        label="Tipo"
        options={KIND_OPTIONS}
        value={filters.kind ?? 'all'}
        onChange={changeKind}
      />
      <PillSelect label="Moneda" id={`${id}-currency`}>
        <select
          id={`${id}-currency`}
          className={selectClassName}
          value={filters.currency ?? ''}
          onChange={(event) =>
            onChange({ ...filters, currency: (event.target.value || undefined) as Currency })
          }
        >
          <option value="">Todas las monedas</option>
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
      </PillSelect>
      <PillSelect label="Categoría" id={`${id}-category`}>
        <select
          id={`${id}-category`}
          className={selectClassName}
          value={filters.categoryId ?? ''}
          disabled={filters.kind === 'set-aside'}
          onChange={(event) =>
            onChange({ ...filters, categoryId: event.target.value || undefined })
          }
        >
          <option value="">Todas las categorías</option>
          {options.map((category) => (
            <option key={category.id} value={category.id}>
              {category.archived ? `${category.name} (archivada)` : category.name}
            </option>
          ))}
        </select>
      </PillSelect>
      <Button variant="ghost" disabled={!hasFilters(filters)} onClick={() => onChange({})}>
        Limpiar filtros
      </Button>
    </div>
  )
}

const selectClassName =
  'h-11 appearance-none rounded-full border border-border bg-transparent pr-10 pl-4 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-50'

/** A native select shaped like a pill, with its label for screen readers. */
function PillSelect({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {children}
      <Icon
        name="arrow_drop_down"
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}
