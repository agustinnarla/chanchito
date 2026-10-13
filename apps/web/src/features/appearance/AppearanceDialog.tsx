import {
  ACCENT_LABELS,
  ACCENTS,
  THEME_PREFERENCE_LABELS,
  THEME_PREFERENCES,
  type Accent,
} from '@chanchito/core'
import type { MouseEvent } from 'react'
import { toast } from 'sonner'
import { DialogActions } from '@/components/DialogActions'
import { Icon } from '@/components/Icon'
import { Segmented } from '@/components/Segmented'
import { Shaped } from '@/components/Shaped'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRadioKeys } from '@/lib/use-radio-keys'
import { cn } from '@/lib/utils'
import { useTheme } from '@/theme/theme-context'
import { useSaveAccent } from './hooks'

const THEMES = THEME_PREFERENCES.map((value) => ({ value, label: THEME_PREFERENCE_LABELS[value] }))

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

/** The theme (this device) and the accent color (the account), spec 011. */
export function AppearanceDialog({ open, onOpenChange }: Props) {
  const { preference, setPreference, accent, setAccent } = useTheme()
  const save = useSaveAccent()

  function choose(next: Accent, origin?: { x: number; y: number }) {
    if (next === accent) return
    setAccent(next, origin)
    save.mutate(next, {
      onError: () => toast.error('No se pudo guardar el color en tu cuenta.'),
    })
  }

  const radioKeys = useRadioKeys(ACCENTS.length, ACCENTS.indexOf(accent), (index) => {
    const next = ACCENTS[index]
    if (next) choose(next)
  })

  function pick(next: Accent, event: MouseEvent<HTMLButtonElement>) {
    // The new color is revealed from the swatch
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect()
    choose(next, { x: left + width / 2, y: top + height / 2 })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apariencia</DialogTitle>
          <DialogDescription>
            El color se guarda en tu cuenta; el tema, en este dispositivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          <p className="text-sm font-medium text-muted-foreground">Tema</p>
          <Segmented
            label="Tema"
            options={THEMES}
            value={preference}
            onChange={(next) => setPreference(next)}
            className="flex w-full"
          />
        </div>

        <div className="space-y-2.5">
          <p id="appearance-color" className="text-sm font-medium text-muted-foreground">
            Color
          </p>
          <div
            role="radiogroup"
            aria-labelledby="appearance-color"
            className="grid grid-cols-3 gap-2 sm:grid-cols-6"
          >
            {ACCENTS.map((key, index) => {
              const checked = key === accent
              return (
                <button
                  key={key}
                  {...radioKeys(index)}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  data-swatch={key}
                  onClick={(event) => pick(key, event)}
                  className={cn(
                    'group flex flex-col items-center gap-1.5 rounded-[18px] px-1 py-2.5 text-xs font-medium transition duration-200 ease-standard active:scale-95',
                    checked ? 'bg-surface' : 'hover:bg-surface',
                  )}
                >
                  {/* The chosen one turns into a flower */}
                  <Shaped
                    shape={checked ? 'flower' : 'cookie'}
                    className="size-11"
                    shapeClassName="bg-(--swatch) group-hover:rotate-12"
                  >
                    <Icon
                      name="check"
                      className={cn(
                        'size-5 text-(--swatch-foreground) transition-opacity duration-300',
                        checked ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </Shaped>
                  {ACCENT_LABELS[key]}
                </button>
              )
            })}
          </div>
        </div>

        <DialogActions>
          <Button onClick={() => onOpenChange(false)}>Listo</Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
}
