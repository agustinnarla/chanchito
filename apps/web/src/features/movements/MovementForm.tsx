import {
  CATEGORY_KIND_LABELS,
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
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

type Props = {
  categories: Category[]
  /** Movement being edited; undefined for a new one. */
  movement?: Movement
  saving: boolean
  saveError: string | null
  onSubmit: (input: MovementInput) => void
  onCancel: () => void
}

const KIND_OPTIONS: CategoryKind[] = ['expense', 'income']
const CURRENCY_OPTIONS: Currency[] = ['ARS', 'USD']

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
    <form aria-label="Movimiento" className="space-y-4" noValidate onSubmit={handleSubmit}>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Tipo</legend>
        <RadioGroup
          className="flex gap-4"
          value={kind}
          onValueChange={(value) => changeKind(value as CategoryKind)}
        >
          {KIND_OPTIONS.map((option) => (
            <div key={option} className="flex items-center gap-2">
              <RadioGroupItem id={fieldId(`kind-${option}`)} value={option} />
              <Label htmlFor={fieldId(`kind-${option}`)}>{CATEGORY_KIND_LABELS[option]}</Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <Field
          label="Monto"
          htmlFor={fieldId('amount')}
          error={errors.amount}
          errorId={errorId('amount')}
        >
          <Input
            id={fieldId('amount')}
            inputMode="decimal"
            autoComplete="off"
            placeholder="1.234,56"
            value={values.amount}
            onChange={(event) => update('amount', event.target.value)}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={describedBy('amount')}
          />
        </Field>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Moneda</legend>
          <RadioGroup
            className="flex h-9 items-center gap-4"
            value={values.currency}
            onValueChange={(value) => update('currency', value as Currency)}
          >
            {CURRENCY_OPTIONS.map((option) => (
              <div key={option} className="flex items-center gap-2">
                <RadioGroupItem id={fieldId(`currency-${option}`)} value={option} />
                <Label htmlFor={fieldId(`currency-${option}`)}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>
      </div>

      <Field
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
      </Field>

      {options.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-sm">
          No tenés categorías de {CATEGORY_KIND_LABELS[kind].toLowerCase()}.{' '}
          <Link to="/categorias" className="underline" onClick={onCancel}>
            Crealas en Categorías
          </Link>
          .
        </p>
      ) : (
        <Field
          label="Categoría"
          htmlFor={fieldId('category')}
          error={errors.categoryId}
          errorId={errorId('categoryId')}
        >
          <select
            id={fieldId('category')}
            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs aria-invalid:border-destructive"
            value={values.categoryId}
            onChange={(event) => update('categoryId', event.target.value)}
            aria-invalid={Boolean(errors.categoryId)}
            aria-describedby={describedBy('categoryId')}
          >
            <option value="">Elegí una categoría</option>
            {options.map((category) => (
              <option key={category.id} value={category.id}>
                {category.archived ? `${category.name} (archivada)` : category.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field
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
      </Field>

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

type FieldProps = {
  label: string
  htmlFor: string
  error: string | undefined
  errorId: string
  children: ReactNode
}

function Field({ label, htmlFor, error, errorId, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
