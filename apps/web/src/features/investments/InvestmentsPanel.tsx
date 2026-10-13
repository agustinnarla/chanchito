import {
  formatBtc,
  formatDate,
  formatMoney,
  formatSignedMoney,
  purchasePrice,
  valueOf,
  type CryptoPurchase,
  type Holding,
} from '@chanchito/core'
import { useId, useState } from 'react'
import { Icon } from '@/components/Icon'
import { Panel } from '@/components/Panel'
import { Shaped } from '@/components/Shaped'
import { Loading, SkeletonRows } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Tone } from '@/features/mood/tone'
import { formatUpdatedAt } from '@/lib/format-updated-at'
import { cn } from '@/lib/utils'
import type { BtcPrice } from './btc-price'
import { DeletePurchaseDialog } from './DeletePurchaseDialog'
import { PurchaseDialog } from './PurchaseDialog'

const COIN = `${import.meta.env.BASE_URL}mood/coin.webp`

type Props = {
  /** Newest first; undefined while loading. */
  purchases: CryptoPurchase[] | undefined
  holding: Holding
  price: BtcPrice | null
  isStale: boolean
  isError: boolean
  onRetry: () => void
}

function gainTone(holding: Holding): Tone {
  if (!holding.gain || holding.gain.amount === 0) return 'neutral'
  return holding.gain.amount > 0 ? 'good' : 'bad'
}

/** Bitcoin (spec 010): what's held, what it cost, what it's worth today and every purchase. */
export function InvestmentsPanel({ purchases, holding, price, isStale, isError, onRetry }: Props) {
  const [creating, setCreating] = useState(false)
  const tone = gainTone(holding)

  return (
    <Panel aria-labelledby="inversiones" data-tone={tone} className="mood-panel px-3 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-3">
        <h2 id="inversiones" className="text-lg font-semibold">
          Inversiones
        </h2>
        {purchases && purchases.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
            <Icon name="add" className="size-5" />
            Nueva compra
          </Button>
        )}
      </div>

      {isError ? (
        <div role="alert" className="space-y-2 px-3 pb-2">
          <p className="text-destructive">No se pudieron cargar tus compras de bitcoin.</p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : !purchases ? (
        <Loading label="Cargando inversiones…">
          <SkeletonRows count={1} />
        </Loading>
      ) : purchases.length === 0 ? (
        <div className="space-y-3 px-3 pb-2">
          <p className="text-muted-foreground">Todavía no cargaste ninguna inversión.</p>
          <Button onClick={() => setCreating(true)}>
            <Icon name="add" className="size-5" />
            Cargar una compra
          </Button>
        </div>
      ) : (
        <>
          <Summary purchases={purchases} holding={holding} price={price} />
          <PriceLine holding={holding} price={price} isStale={isStale} />
          <Purchases purchases={purchases} holding={holding} />
        </>
      )}

      <PurchaseDialog open={creating} onOpenChange={setCreating} holding={holding} />
    </Panel>
  )
}

function Summary({
  purchases,
  holding,
  price,
}: Pick<Props, 'holding' | 'price'> & { purchases: CryptoPurchase[] }) {
  const platforms = new Set(purchases.map((p) => p.platform))
  const where = platforms.size === 1 ? ` · en ${[...platforms][0]}` : ''
  const { gain, gainRatio, value } = holding
  const percent = gainRatio === null ? null : Math.round(gainRatio * 100)

  return (
    <div className="group flex flex-wrap items-center gap-4 px-3">
      <Shaped shape="cookie" className="size-16" shapeClassName="shape-morph bg-tone-glow">
        <img src={COIN} alt="" className="size-10" />
      </Shaped>
      <div className="min-w-0 flex-[1_1_12rem]">
        <p className="text-[17px] font-semibold">Bitcoin</p>
        <p className="font-mono text-sm text-muted-foreground">
          {formatBtc(holding.quantity)}
          {where}
        </p>
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-2 sm:text-right">
        <div>
          <dt className="text-xs text-muted-foreground">Pusiste</dt>
          <dd className="font-mono">{formatMoney(holding.invested)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Vale hoy</dt>
          <dd className="font-mono text-xl font-semibold text-tone-strong">
            {value ? formatMoney(value) : '—'}
          </dd>
          {value && price && (
            <dd className="font-mono text-xs text-muted-foreground">
              ≈ {formatMoney(valueOf(holding.quantity, price.usd))}
            </dd>
          )}
        </div>
        {gain && percent !== null && (
          <div>
            <dt className="sr-only">Ganancia</dt>
            <dd className="inline-flex items-center gap-1 rounded-full bg-tone-chip py-1.5 pr-3 pl-2 text-[13px] font-semibold text-tone-on-chip">
              {gain.amount !== 0 && (
                <Icon
                  name={gain.amount > 0 ? 'trending_up' : 'trending_down'}
                  className="size-[18px]"
                />
              )}
              {formatSignedMoney(gain)} · {percent > 0 ? '+' : ''}
              {percent}%
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}

function PriceLine({ holding, price, isStale }: Pick<Props, 'holding' | 'price' | 'isStale'>) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 px-3 text-xs text-muted-foreground">
      <Icon name="schedule" className="size-4" />
      {price ? (
        <>
          <span>
            1 BTC = {formatMoney(price.ars)} ({formatMoney(price.usd)}) ·{' '}
            {isStale ? 'último precio de Binance, ' : 'Binance, actualizado '}
            {formatUpdatedAt(price.at)}
          </span>
        </>
      ) : (
        <span>No pudimos traer el precio de Binance.</span>
      )}
      {holding.averagePrice && (
        <span>· Precio promedio de compra {formatMoney(holding.averagePrice)}</span>
      )}
    </p>
  )
}

function Purchases({ purchases, holding }: { purchases: CryptoPurchase[]; holding: Holding }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CryptoPurchase | null>(null)
  const [deleting, setDeleting] = useState<CryptoPurchase | null>(null)
  const listId = useId()

  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        className="ml-auto flex h-11 items-center gap-1 rounded-full pr-3 pl-4 text-sm font-semibold hover:bg-surface"
      >
        Compras ({purchases.length})
        <Icon
          name="keyboard_arrow_down"
          className={cn('transition-transform duration-300 ease-standard', open && 'rotate-180')}
        />
      </button>
      {open && (
        <ul
          id={listId}
          aria-label="Compras de bitcoin"
          className="pb-1 duration-300 ease-emphasized animate-in fade-in"
        >
          {purchases.map((purchase) => (
            <li
              key={purchase.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 rounded-2xl py-1 pl-3 text-sm"
            >
              <span>
                <time dateTime={purchase.occurredOn}>{formatDate(purchase.occurredOn)}</time>
                <span className="block font-mono text-xs text-muted-foreground">
                  {formatBtc(purchase.quantity)} a{' '}
                  {formatMoney(purchasePrice(purchase.quantity, purchase.cost))}
                </span>
              </span>
              <span className="font-mono font-medium">{formatMoney(purchase.cost)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Acciones de la compra del ${formatDate(purchase.occurredOn)}`}
                  className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-surface"
                >
                  <Icon name="more_vert" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setEditing(purchase)}>
                    <Icon name="edit" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(purchase)}>
                    <Icon name="delete" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <PurchaseDialog
          open
          onOpenChange={(next) => !next && setEditing(null)}
          holding={holding}
          purchase={editing}
        />
      )}
      {deleting && (
        <DeletePurchaseDialog
          purchase={deleting}
          open
          onOpenChange={(next) => !next && setDeleting(null)}
        />
      )}
    </div>
  )
}
