import { dayPart, greeting } from '@chanchito/core'
import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth, type SignInFailure } from '@/auth/auth-context'
import { CategoryEmoji } from '@/components/CategoryEmoji'
import { Icon } from '@/components/Icon'
import { Shaped } from '@/components/Shaped'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DAY_PART_EMOJI } from '@/features/mood/tone'
import { cn } from '@/lib/utils'

const BASE = import.meta.env.BASE_URL
const EMAIL_KEY = 'chanchito:last-email'

const FEATURES = [
  { emoji: 'shopping_cart', text: 'Ingresos y gastos' },
  { emoji: 'chart_increasing', text: 'Presupuestos' },
  { emoji: 'mobile_phone', text: 'Ahorros' },
] as const

function redirectTarget(state: unknown): string {
  if (state && typeof state === 'object' && 'from' in state && typeof state.from === 'string') {
    return state.from
  }
  return '/'
}

/** The last email that signed in here, to fill it in (spec 011). Blocked storage: none. */
function readEmail(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeEmail(email: string | null): void {
  try {
    if (email) localStorage.setItem(EMAIL_KEY, email)
    else localStorage.removeItem(EMAIL_KEY)
  } catch {
    // Blocked storage: the email isn't remembered.
  }
}

const HINTS: Record<SignInFailure, string> = {
  credentials: 'Revisalos y probá de nuevo.',
  network: '',
  other: '',
}

export function LoginPage() {
  const { session, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [remembered, setRemembered] = useState(readEmail)
  const [email, setEmail] = useState(remembered)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [error, setError] = useState<{ reason: SignInFailure; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  const target = redirectTarget(location.state)

  if (!loading && session) {
    return <Navigate to={target} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await signIn(email.trim(), password)
    setSubmitting(false)
    if (result.ok) {
      writeEmail(email.trim())
      void navigate(target, { replace: true })
    } else {
      setError({ reason: result.reason, message: result.message })
    }
  }

  function forgetEmail() {
    writeEmail(null)
    setRemembered('')
    setEmail('')
    emailRef.current?.focus()
  }

  function watchCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState('CapsLock'))
  }

  const part = dayPart(new Date())
  const wrongPassword = error?.reason === 'credentials'

  return (
    <main className="grid min-h-svh gap-4 p-4 lg:grid-cols-[1.1fr_1fr]">
      <section
        aria-label="Chanchito"
        className="flex flex-col justify-between gap-6 rounded-[32px] bg-[radial-gradient(110%_120%_at_0%_0%,var(--active)_0%,var(--surface)_50%,var(--surface-low)_100%)] p-6 sm:p-8 lg:min-h-[calc(100svh-2rem)]"
      >
        <p className="flex items-center gap-2.5 text-xl font-bold">
          <img src={`${BASE}brand/chanchito.webp`} alt="" className="size-8" />
          Chanchito
        </p>

        <div className="flex items-center gap-5 lg:flex-col lg:items-start lg:gap-7">
          <span className="relative size-24 shrink-0 lg:size-44">
            <span
              aria-hidden="true"
              className="shape shape-sunny absolute inset-0 animate-spin-slow bg-active motion-reduce:animate-none"
            />
            <img
              src={`${BASE}brand/chanchito-grande.webp`}
              alt=""
              className="absolute inset-[15%] size-[70%] animate-bob motion-reduce:animate-none"
            />
            <img
              src={DAY_PART_EMOJI[part]}
              alt=""
              className="absolute -right-1 bottom-0 size-8 lg:size-12"
            />
          </span>
          <div>
            <p className="text-[15px] text-muted-foreground">{greeting(part)}</p>
            <p className="mt-1 max-w-md text-2xl leading-tight font-bold tracking-tight text-balance lg:text-4xl">
              Tus pesos y tus dólares, en orden.
            </p>
          </div>
        </div>

        <ul aria-label="Qué podés hacer" className="hidden flex-wrap gap-2.5 sm:flex">
          {FEATURES.map((feature) => (
            <li
              key={feature.text}
              className="flex items-center gap-2.5 rounded-full bg-background/40 py-1.5 pr-4 pl-1.5 text-sm font-medium"
            >
              <Shaped shape="cookie" className="size-9" shapeClassName="bg-surface">
                <CategoryEmoji emoji={feature.emoji} className="size-5" />
              </Shaped>
              {feature.text}
            </li>
          ))}
          <li className="flex items-center gap-2.5 rounded-full bg-background/40 py-1.5 pr-4 pl-1.5 text-sm font-medium">
            <Shaped shape="cookie" className="size-9" shapeClassName="bg-surface">
              <img src={`${BASE}mood/coin.webp`} alt="" className="size-5" />
            </Shaped>
            Bitcoin
          </li>
        </ul>
      </section>

      <div className="flex items-center justify-center px-2 py-6 sm:px-6">
        <form
          aria-labelledby="login-title"
          className="w-full max-w-sm space-y-5"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div>
            <h1 id="login-title" className="text-3xl font-bold tracking-tight">
              Iniciar sesión
            </h1>
            <p className="mt-1.5 text-[15px] text-muted-foreground">
              {remembered ? 'Qué bueno verte de nuevo.' : 'Ingresá con tu email y contraseña.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-[20px] bg-bad-chip px-4 py-3.5 text-sm text-bad-on-chip duration-300 animate-in fade-in slide-in-from-top-1"
            >
              <Icon name="info" filled className="mt-px size-5" />
              <p>
                <strong className="block font-semibold">{error.message}</strong>
                {HINTS[error.reason]}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                ref={emailRef}
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={cn('h-14 text-base', remembered && email === remembered && 'pr-32')}
              />
              {remembered && email === remembered && (
                <span className="absolute top-1/2 right-2.5 inline-flex -translate-y-1/2 items-center gap-1 rounded-full bg-active py-1 pr-2.5 pl-1.5 text-xs font-semibold text-active-foreground">
                  <Icon name="check" className="size-4" />
                  Recordado
                </span>
              )}
            </div>
            {remembered && (
              <button
                type="button"
                onClick={forgetEmail}
                className="text-[13px] font-semibold text-link hover:underline"
              >
                ¿No sos vos? Usar otro email
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={watchCapsLock}
                onKeyUp={watchCapsLock}
                aria-invalid={wrongPassword}
                aria-describedby={capsLock ? 'caps-lock' : undefined}
                className="h-14 pr-14 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-1.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-high"
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
              </button>
            </div>
            <p
              id="caps-lock"
              aria-live="polite"
              className="flex items-center gap-1.5 text-[13px] font-medium text-warn-strong empty:hidden"
            >
              {capsLock && (
                <>
                  <Icon name="keyboard_capslock" className="size-[18px]" />
                  Bloq Mayús está activado.
                </>
              )}
            </p>
          </div>

          <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={submitting}>
            {submitting && (
              <Icon
                name="progress_activity"
                className="size-5 animate-spin motion-reduce:animate-none"
              />
            )}
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </div>
    </main>
  )
}
