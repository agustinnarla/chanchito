import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './auth-context'

export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <p className="p-6 text-muted-foreground">Cargando…</p>
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
