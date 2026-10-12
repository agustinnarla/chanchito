import {
  convertMoney,
  formatMoney,
  formatMonthName,
  IsoDateSchema,
  monthOf,
  parseContributionForm,
  parseMoney,
  todayIso,
  type ContributionFormErrors,
  type ContributionFormValues,
  type ExchangeRate,
  type GoalProgress,
} from '@chanchito/core'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { DialogActions } from '@/components/DialogActions'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCreateContribution } from './hooks'

const SYMBOL = { ARS: '$', USD: 'US$' } as const

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  progress: GoalProgress
  kind: 'deposit' | 'withdrawal'
  rate: ExchangeRate | null
}

/** Put money into a goal, or take it out. Not an expense (spec 009). */
export function ContributionDialog({ open, onOpenChange, progress, kind, rate }: Props) {
  const { goal } = progress
  const percent = progress.ratio === null ? null : Math.round(progress.ratio * 100)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kind === 'deposit' ? 'Aportar' : 'Retirar'}</DialogTitle>
          <DialogDescription>
            {goal.name}
            {percent !== null && ` · llevás el ${percent}%`}
          </DialogDescription>
        </DialogHeader>
        <ContributionForm
          progress={progress}
          kind={kind}
          rate={rate}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

type FormProps = Omit<Props, 'open' | 'onOpenChange'> & { onDone: () => void }

/** What the typed amount is, if it's valid so far, for the preview. */
function typedCents(text: string, progress: GoalProgress): number | null {
  try {
    return parseMoney(text, progress.saved.currency).amount
  } catch {
    return null
  }
}

function ContributionForm({ progress, kind, rate, onDone }: FormProps) {
  const id = useId()
  const { goal, saved, target } = progress
  const [values, setValues] = useState<ContributionFormValues>({
    amount: '',
    occurredOn: todayIso(),
  })
  const [errors, setErrors] = useState<ContributionFormErrors>({})
  const create = useCreateContribution()

  function change<K extends keyof ContributionFormValues>(field: K, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    create.reset()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = parseContributionForm(values, { goal, saved, kind })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    create.mutate(result.data, {
      onSuccess: () => {
        onDone()
        toast.success(kind === 'deposit' ? 'Aporte guardado' : 'Retiro guardado')
      },
    })
  }

  const cents = typedCents(values.amount, progress)
  const after = cents === null ? null : saved.amount + (kind === 'deposit' ? cents : -cents)
  const otherCurrency = goal.target.currency !== goal.savingCurrency
  const equivalent =
    cents !== null && otherCurrency && rate
      ? convertMoney({ amount: cents, currency: saved.currency }, goal.target.currency, rate)
      : null
  const percent = (amount: number) => (target ? Math.round((amount / target.amount) * 100) : null)
  const errorId = (field: keyof ContributionFormValues) => `${id}-${field}-error`
  const contributionDay = IsoDateSchema.safeParse(values.occurredOn).success
    ? values.occurredOn
    : todayIso()

  return (
    <form
      aria-label={kind === 'deposit' ? 'Aporte' : 'Retiro'}
      className="space-y-5"
      noValidate
      onSubmit={handleSubmit}
    >
      <div>
        <div className="flex items-center gap-2 rounded-[20px] bg-surface py-2 pr-2 pl-4 focus-within:ring-3 focus-within:ring-ring/40">
          <label htmlFor={`${id}-amount`} className="sr-only">
            Monto
          </label>
          <span aria-hidden="true" className="font-mono text-xl text-muted-foreground">
            {SYMBOL[saved.currency]}
          </span>
          <input
            id={`${id}-amount`}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            value={values.amount}
            onChange={(event) => change('amount', event.target.value)}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? errorId('amount') : undefined}
            className="w-0 min-w-0 flex-1 bg-transparent py-2 font-mono text-3xl font-medium outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        {errors.amount ? (
          <p id={errorId('amount')} className="mt-2 text-sm text-destructive">
            {errors.amount}
          </p>
        ) : (
          equivalent && (
            <p className="mt-2 text-sm text-muted-foreground">
              ≈ {formatMoney(equivalent)} al dólar MEP de hoy
            </p>
          )
        )}
      </div>

      {after !== null && target && (
        <div className="space-y-2 rounded-[20px] bg-surface px-4 py-3.5">
          <p className="flex justify-between text-sm">
            <span>Con este {kind === 'deposit' ? 'aporte' : 'retiro'}</span>
            <span className="font-mono font-semibold">{percent(Math.max(0, after))}%</span>
          </p>
          <span
            aria-hidden="true"
            className="relative block h-2.5 overflow-hidden rounded-full bg-surface-high"
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-primary/40 transition-[width] duration-300"
              style={{ width: `${Math.min(100, Math.max(0, (after / target.amount) * 100))}%` }}
            />
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
              style={{
                width: `${Math.min(100, Math.max(0, (Math.min(saved.amount, after) / target.amount) * 100))}%`,
              }}
            />
          </span>
        </div>
      )}

      <FormField
        label="Fecha"
        htmlFor={`${id}-date`}
        error={errors.occurredOn}
        errorId={errorId('occurredOn')}
      >
        <Input
          id={`${id}-date`}
          type="date"
          value={values.occurredOn}
          onChange={(event) => change('occurredOn', event.target.value)}
          aria-invalid={Boolean(errors.occurredOn)}
          aria-describedby={errors.occurredOn ? errorId('occurredOn') : undefined}
        />
      </FormField>

      {kind === 'deposit' && (
        <p className="text-sm text-muted-foreground">
          Sale de lo disponible de {formatMonthName(monthOf(contributionDay))}, pero no cuenta como
          gasto.
        </p>
      )}

      {create.isError && (
        <p role="alert" className="text-sm text-destructive">
          {create.error.message}
        </p>
      )}

      <DialogActions>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Guardando…' : kind === 'deposit' ? 'Aportar' : 'Retirar'}
        </Button>
      </DialogActions>
    </form>
  )
}
