import { formatDate, formatMoney, type Contribution, type SavingsGoal } from '@chanchito/core'
import { toast } from 'sonner'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useDeleteContribution } from './hooks'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: SavingsGoal
  /** This goal's contributions, newest first. */
  contributions: Contribution[]
}

/** A goal's contributions and withdrawals, each one with a way to delete it. */
export function ContributionsDialog({ open, onOpenChange, goal, contributions }: Props) {
  const remove = useDeleteContribution()

  function handleDelete(contribution: Contribution) {
    remove.mutate(contribution.id, {
      onSuccess: () => toast.success('Aporte eliminado'),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aportes</DialogTitle>
          <DialogDescription>{goal.name}</DialogDescription>
        </DialogHeader>
        {contributions.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay aportes.</p>
        ) : (
          <ul aria-label={`Aportes de ${goal.name}`} className="-mx-2">
            {contributions.map((contribution) => {
              const withdrawal = contribution.amount.amount < 0
              return (
                <li
                  key={contribution.id}
                  className="flex items-center gap-3 rounded-2xl px-2 py-1.5"
                >
                  <span className="flex-1">
                    <span className="block text-[15px] font-medium">
                      {withdrawal ? 'Retiro' : 'Aporte'}
                    </span>
                    <time
                      dateTime={contribution.occurredOn}
                      className="text-sm text-muted-foreground"
                    >
                      {formatDate(contribution.occurredOn)}
                    </time>
                  </span>
                  <span className={cn('font-mono text-[15px]', !withdrawal && 'text-income')}>
                    {withdrawal ? '' : '+'}
                    {formatMoney(contribution.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar ${withdrawal ? 'retiro' : 'aporte'} del ${formatDate(contribution.occurredOn)}`}
                    className="text-muted-foreground"
                    disabled={remove.isPending}
                    onClick={() => handleDelete(contribution)}
                  >
                    <Icon name="delete" className="size-5" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
