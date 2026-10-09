import type { RouteObject } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { CategoriesPage } from './features/categories/CategoriesPage'
import { MovementsPage } from './features/movements/MovementsPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'movimientos', element: <MovementsPage /> },
          {
            path: 'balance',
            // Loaded on demand: it brings Recharts, the biggest dependency.
            lazy: async () => ({
              Component: (await import('./features/balance/BalancePage')).BalancePage,
            }),
          },
          { path: 'presupuestos', element: <PlaceholderPage title="Presupuestos" /> },
          { path: 'categorias', element: <CategoriesPage /> },
          { path: '*', element: <PlaceholderPage title="Página no encontrada" /> },
        ],
      },
    ],
  },
]
