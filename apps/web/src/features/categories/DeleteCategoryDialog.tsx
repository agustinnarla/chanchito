import type { Category } from '@chanchito/core'
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
import { useDeleteCategory } from './hooks'

type Props = {
  category: Category
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteCategoryDialog({ category, open, onOpenChange }: Props) {
  const remove = useDeleteCategory()

  function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    // Keep the dialog open until the delete finishes, so an error can be shown.
    event.preventDefault()
    remove.mutate(category, {
      onSuccess: (result) => {
        onOpenChange(false)
        if (result === 'archived') {
          toast.info(`«${category.name}» tiene movimientos, así que se archivó.`)
        }
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
          <AlertDialogTitle>¿Eliminar «{category.name}»?</AlertDialogTitle>
          <AlertDialogDescription>
            {category.archived
              ? 'Esta acción no se puede deshacer.'
              : 'Si tiene movimientos, se va a archivar en vez de eliminarse.'}
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
