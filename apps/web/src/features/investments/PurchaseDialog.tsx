import {
  formatAmountForInput,
  formatBtc,
  formatBtcForInput,
  formatMoney,
  parseBtc,
  parsePositiveAmount,
  parsePurchaseForm,
  purchasePrice,
  todayIso,
  type CryptoPurchase,
  type Holding,
  type PurchaseFormErrors,
  type PurchaseFormValues,
} from '@chanchito/core'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
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
import { useCreatePurchase, useUpdatePurchase } from './hooks'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** What is held now, for the preview. */
  holding: Holding
  /** Purchase to edit; undefined to load a new one. */
  purchase?: CryptoPurchase
}

/** Load or edit a bitcoin purchase, paid in pesos (spec 010). */
export function PurchaseDialog({ open, onOpenChange, holding, purchase }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{purchase ? 'Editar compra' : 'Nueva compra'}</DialogTitle>
          <DialogDescription>Bitcoin, pagado en pesos.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open: the form starts fresh each time. */}
        <PurchaseForm holding={holding} purchase={purchase} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function initialValues(purchase?: CryptoPurchase): PurchaseFormValues {
  if (!purchase) return { quantity: '', cost: '', occurredOn: todayIso(), platform: 'Binance' }
  return {
    quantity: formatBtcForInput(purchase.quantity),
    cost: formatAmountForInput(purchase.cost.amount),
    occurredOn: purchase.occurredOn,
    platform: purchase.platform,
  }
}

/**
 * Once both amounts are valid: this purchase's price, what's held after it and the new average.
 * Editing replaces the purchase's old amounts.
 */
function previewOf(values: PurchaseFormValues, holding: Holding, purchase?: CryptoPurchase) {
  const quantity = parseBtc(values.quantity)
  const cost = parsePositiveAmount(values.cost, 'ARS')
  if (typeof quantity === 'string' || typeof cost === 'string') return null
  const total = holding.quantity - (purchase?.quantity ?? 0) + quantity
  const invested = holding.invested.amount - (purchase?.cost.amount ?? 0) + cost.amount
  return {
    price: purchasePrice(quantity, cost),
    total,
    average: purchasePrice(total, { amount: invested, currency: 'ARS' }),
  }
}

type FormProps = { holding: Holding; purchase?: CryptoPurchase; onDone: () => void }

function PurchaseForm({ holding, purchase, onDone }: FormProps) {
  const id = useId()
  const [values, setValues] = useState(() => initialValues(purchase))
  const [errors, setErrors] = useState<PurchaseFormErrors>({})
  const create = useCreatePurchase()
  const update = useUpdatePurchase()
  const save = purchase ? update : create

  function change(field: keyof PurchaseFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    save.reset()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = parsePurchaseForm(values, todayIso())
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    const onSuccess = () => {
      onDone()
      toast.success('Compra guardada')
    }
    if (purchase) {
      update.mutate({ id: purchase.id, input: result.data }, { onSuccess })
    } else {
      create.mutate(result.data, { onSuccess })
    }
  }

  const preview = previewOf(values, holding, purchase)

  const errorId = (field: keyof PurchaseFormValues) => `${id}-${field}-error`
  const field = (name: keyof PurchaseFormValues, label: string, input: ReactNode) => (
    <FormField label={label} htmlFor={`${id}-${name}`} error={errors[name]} errorId={errorId(name)}>
      {input}
    </FormField>
  )
  const inputProps = (name: keyof PurchaseFormValues) => ({
    id: `${id}-${name}`,
    value: values[name],
    onChange: (event: { target: { value: string } }) => change(name, event.target.value),
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? errorId(name) : undefined,
  })

  return (
    <form aria-label="Compra de bitcoin" className="space-y-5" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        {field(
          'quantity',
          'Bitcoin comprado (BTC)',
          <Input
            {...inputProps('quantity')}
            inputMode="decimal"
            placeholder="0,0010"
            className="font-mono"
          />,
        )}
        {field(
          'cost',
          'Pagaste ($)',
          <Input
            {...inputProps('cost')}
            inputMode="decimal"
            placeholder="0,00"
            className="font-mono"
          />,
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {field(
          'occurredOn',
          'Fecha',
          <Input {...inputProps('occurredOn')} type="date" max={todayIso()} />,
        )}
        {field('platform', 'Plataforma', <Input {...inputProps('platform')} />)}
      </div>

      {preview && (
        <dl className="space-y-1.5 rounded-[20px] bg-surface px-4 py-3.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Precio de esta compra</dt>
            <dd className="font-mono">{formatMoney(preview.price)} por BTC</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Vas a tener</dt>
            <dd className="font-mono">{formatBtc(preview.total)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Nuevo precio promedio</dt>
            <dd className="font-mono">{formatMoney(preview.average)}</dd>
          </div>
        </dl>
      )}

      {save.isError && (
        <p role="alert" className="text-sm text-destructive">
          {save.error.message}
        </p>
      )}

      <DialogActions>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </form>
  )
}
