import {
  formatAmountForInput,
  parseMovementForm,
  sortCategories,
  todayIso,
  type Category,
  type CategoryKind,
  type Currency,
  type Movement,
  type MovementFormErrors,
  type MovementFormValues,
  type MovementInput,
} from '@chanchito/core'
import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { CategoryPicker } from '@/components/CategoryPicker'
import { FormField } from '@/components/FormField'
import { Segmented } from '@/components/Segmented'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  categories: Category[]
  /** Movement being edited; undefined for a new one. */
  movement?: Movement
  saving: boolean
  saveError: string | null
  onSubmit: (input: MovementInput) => void
  onCancel: () => void
}

const KIND_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
] as const satisfies readonly { value: CategoryKind; label: string }[]

const CURRENCY_OPTIONS = [
  { value: 'ARS', label: 'ARS' },
  { value: 'USD', label: 'USD' },
] as const satisfies readonly { value: Currency; label: string }[]

const SYMBOL: Record<Currency, string> = { ARS: '$', USD: 'US$' }

function initialValues(movement?: Movement): MovementFormValues {
  if (!movement) {
    return { amount: '', currency: 'ARS', occurredOn: todayIso(), categoryId: '', description: '' }
  }
  return {
    amount: formatAmountForInput(movement.amount.amount),
    currency: movement.amount.currency,
    occurredOn: movement.occurredOn,
    categoryId: movement.category.id,
    description: movement.description ?? '',
  }
}

export function MovementForm({
  categories,
  movement,
  saving,
  saveError,
  onSubmit,
  onCancel,
}: Props) {
  const id = useId()
  const [kind, setKind] = useState<CategoryKind>(movement?.category.kind ?? 'expense')
  const [values, setValues] = useState(() => initialValues(movement))
  const [errors, setErrors] = useState<MovementFormErrors>({})

  // Active categories of the chosen kind, plus the movement's own category if it was archived.
  const options = sortCategories(
    categories.filter((c) => c.kind === kind && (!c.archived || c.id === movement?.category.id)),
  )

  function update<K extends keyof MovementFormValues>(field: K, value: MovementFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function changeKind(next: CategoryKind) {
    setKind(next)
    const current = categories.find((c) => c.id === values.categoryId)
    if (current && current.kind !== next) update('categoryId', '')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = parseMovementForm(values)
    if (result.ok) {
      onSubmit(result.data)
    } else {
      setErrors(result.errors)
    }
  }

  const fieldId = (field: string) => `${id}-${field}`
  const errorId = (field: keyof MovementFormValues) => `${id}-${field}-error`
  const describedBy = (field: keyof MovementFormValues) =>
    errors[field] ? errorId(field) : undefined

  return (
    <form aria-label="Movimiento" className="space-y-5" noValidate onSubmit={handleSubmit}>
      <Segmented
        label="Tipo"
        options={KIND_OPTIONS}
        value={kind}
        onChange={changeKind}
        className="flex w-full"
      />

      <div>
        <div className="flex items-center gap-3 rounded-[20px] bg-surface py-2 pr-2 pl-5 focus-within:ring-3 focus-within:ring-ring/40">
          <label htmlFor={fieldId('amount')} className="sr-only">
            Monto
          </label>
          <span aria-hidden="true" className="font-mono text-2xl text-muted-foreground">
            {SYMBOL[values.currency]}
          </span>
          <input
            id={fieldId('amount')}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            value={values.amount}
            onChange={(event) => update('amount', event.target.value)}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={describedBy('amount')}
            className="min-w-0 flex-1 bg-transparent py-2 font-mono text-3xl font-medium outline-none placeholder:text-muted-foreground/60"
          />
          <Segmented
            label="Moneda"
            options={CURRENCY_OPTIONS}
            value={values.currency}
            onChange={(currency) => update('currency', currency)}
            className="bg-popover"
          />
        </div>
        {errors.amount && (
          <p id={errorId('amount')} className="mt-2 text-sm text-destructive">
            {errors.amount}
          </p>
        )}
      </div>

      <div className="space-y-2.5">
        <p id={fieldId('category-label')} className="text-sm font-medium text-muted-foreground">
          Categoría
        </p>
        {options.length === 0 ? (
          <p className="rounded-[18px] bg-surface p-4 text-sm">
            No tenés categorías de {kind === 'expense' ? 'gasto' : 'ingreso'}.{' '}
            <Link to="/categorias" className="font-semibold underline" onClick={onCancel}>
              Crealas en Categorías
            </Link>
            .
          </p>
        ) : (
          <CategoryPicker
            categories={options}
            value={values.categoryId}
            onChange={(categoryId) => update('categoryId', categoryId)}
            labelId={fieldId('category-label')}
            error={errors.categoryId}
            errorId={errorId('categoryId')}
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <FormField
          label="Fecha"
          htmlFor={fieldId('date')}
          error={errors.occurredOn}
          errorId={errorId('occurredOn')}
        >
          <Input
            id={fieldId('date')}
            type="date"
            value={values.occurredOn}
            onChange={(event) => update('occurredOn', event.target.value)}
            aria-invalid={Boolean(errors.occurredOn)}
            aria-describedby={describedBy('occurredOn')}
          />
        </FormField>
        <FormField
          label="Descripción (opcional)"
          htmlFor={fieldId('description')}
          error={errors.description}
          errorId={errorId('description')}
        >
          <Input
            id={fieldId('description')}
            placeholder="Ej: Compra del mes"
            value={values.description}
            onChange={(event) => update('description', event.target.value)}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy('description')}
          />
        </FormField>
      </div>

      {saveError && (
        <p role="alert" className="text-sm text-destructive">
          {saveError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || options.length === 0}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
