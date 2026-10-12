import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router'
import { useAuth } from '@/auth/auth-context'
import { Icon } from '@/components/Icon'
import type { IconName } from '@/components/icons'
import { NewMovementButton } from '@/features/movements/NewMovementButton'
import { usePrefetchSections } from '@/features/use-prefetch-sections'
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query'
import { useStoredFlag } from '@/lib/use-stored-flag'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/theme/ThemeToggle'

const NAV_ITEMS: readonly { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Inicio', icon: 'home' },
  { to: '/movimientos', label: 'Movimientos', icon: 'receipt_long' },
  { to: '/balance', label: 'Balance', icon: 'bar_chart' },
  { to: '/presupuestos', label: 'Presupuestos', icon: 'savings' },
  { to: '/categorias', label: 'Categorías', icon: 'sell' },
]

const LOGO = `${import.meta.env.BASE_URL}brand/chanchito.webp`

/**
 * The current section. Links between sections use view transitions: the old page fades out and
 * the new one fades in (styles in index.css), and the scroll goes back to the top.
 */
function Page() {
  usePrefetchSections()
  return (
    <>
      <div className="page-transition">
        <Outlet />
      </div>
      <ScrollRestoration />
    </>
  )
}

export function Layout() {
  const isPhone = useMediaQuery(PHONE_QUERY)
  return isPhone ? <PhoneLayout /> : <DesktopLayout />
}

function DesktopLayout() {
  const { signOut } = useAuth()
  const [open, setOpen] = useStoredFlag('chanchito:menu-open', true)

  return (
    <div className="flex min-h-svh gap-4 p-4">
      <aside
        className={cn(
          'sticky top-4 flex h-[calc(100svh-2rem)] shrink-0 flex-col gap-4 rounded-[28px] bg-surface-low px-3 py-4 transition-[width] duration-300 ease-emphasized',
          open ? 'w-64' : 'w-20',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 px-1',
            open ? 'justify-between' : 'justify-center',
          )}
        >
          {open && (
            <Link
              viewTransition
              to="/"
              className="flex items-center gap-2.5 text-xl font-bold duration-300 animate-in fade-in"
            >
              <img src={LOGO} alt="" className="size-8" />
              Chanchito
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Minimizar menú' : 'Abrir menú'}
            aria-expanded={open}
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-surface"
          >
            <Icon name={open ? 'left_panel_close' : 'left_panel_open'} />
          </button>
        </div>

        <NewMovementButton compact={!open} />

        <nav aria-label="Principal" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              viewTransition
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              aria-label={open ? undefined : item.label}
              title={open ? undefined : item.label}
              className={({ isActive }) =>
                cn(
                  'flex h-13 items-center gap-3 rounded-full text-[15px] font-medium transition-colors',
                  open ? 'px-4' : 'justify-center',
                  isActive
                    ? 'bg-active font-semibold text-active-foreground'
                    : 'text-muted-foreground hover:bg-surface',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} filled={isActive} />
                  {open && <span className="duration-300 animate-in fade-in">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div
          className={cn(
            'mt-auto flex gap-2',
            open ? 'items-center justify-between' : 'flex-col items-center',
          )}
        >
          <ThemeToggle showLabel={open} />
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-surface"
          >
            <Icon name="logout" className="size-5" />
          </button>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-5xl min-w-0">
        <Page />
      </main>
    </div>
  )
}

function PhoneLayout() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-svh pb-24">
      <header className="flex items-center justify-between px-4 py-3">
        <Link viewTransition to="/" className="flex items-center gap-2 text-lg font-bold">
          <img src={LOGO} alt="" className="size-7" />
          Chanchito
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="Cerrar sesión"
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground"
          >
            <Icon name="logout" className="size-5" />
          </button>
        </div>
      </header>

      <main className="px-3">
        <Page />
      </main>

      <NewMovementButton variant="fab" />

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 bg-surface-low px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            viewTransition
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium"
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    // The active pill grows from the center, as in Material 3
                    'flex h-8 w-14 items-center justify-center rounded-full transition duration-300 ease-emphasized',
                    isActive
                      ? 'bg-active text-active-foreground'
                      : 'scale-x-50 text-muted-foreground',
                  )}
                >
                  <Icon name={item.icon} filled={isActive} />
                </span>
                <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
