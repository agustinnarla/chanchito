import type { RouteObject } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
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
          { path: 'movimientos', element: <PlaceholderPage title="Movimientos" /> },
          { path: 'balance', element: <PlaceholderPage title="Balance" /> },
          { path: 'presupuestos', element: <PlaceholderPage title="Presupuestos" /> },
          { path: 'categorias', element: <PlaceholderPage title="Categorías" /> },
          { path: '*', element: <PlaceholderPage title="Página no encontrada" /> },
        ],
      },
    ],
  },
]
