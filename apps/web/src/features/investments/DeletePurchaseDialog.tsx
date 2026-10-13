import { formatBtc, formatDate, formatMoney, type CryptoPurchase } from '@chanchito/core'
import type { MouseEvent } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeletePurchase } from './hooks'

type Props = { purchase: CryptoPurchase; open: boolean; onOpenChange: (open: boolean) => void }

export function DeletePurchaseDialog({ purchase, open, onOpenChange }: Props) {
  const remove = useDeletePurchase()

  function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    // Keep the dialog open until the delete finishes, so an error can be shown.
    event.preventDefault()
    remove.mutate(purchase.id, {
      onSuccess: () => {
        onOpenChange(false)
        toast.success('Compra eliminada')
      },
    })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) remove.reset()
        onOpenChange(next)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar esta compra?</AlertDialogTitle>
          <AlertDialogDescription>
            {formatBtc(purchase.quantity)} por {formatMoney(purchase.cost)} ·{' '}
            {formatDate(purchase.occurredOn)}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError && (
          <p role="alert" className="text-sm text-destructive">
            {remove.error.message}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={handleConfirm}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
