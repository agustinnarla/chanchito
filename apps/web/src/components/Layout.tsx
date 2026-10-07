import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '@/auth/auth-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/movimientos', label: 'Movimientos' },
  { to: '/balance', label: 'Balance' },
  { to: '/presupuestos', label: 'Presupuestos' },
  { to: '/categorias', label: 'Categorías' },
] as const

export function Layout() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="font-semibold">
            Finanzas
          </Link>
          <nav aria-label="Principal" className="flex flex-1 flex-wrap gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent font-medium text-accent-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
