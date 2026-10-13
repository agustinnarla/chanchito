import type { RouteObject } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { BalancePage } from './features/balance/BalancePage'
import { BudgetsPage } from './features/budgets/BudgetsPage'
import { CategoriesPage } from './features/categories/CategoriesPage'
import { MovementsPage } from './features/movements/MovementsPage'
import { SavingsPage } from './features/savings/SavingsPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'

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
          { path: 'balance', element: <BalancePage /> },
          { path: 'presupuestos', element: <BudgetsPage /> },
          { path: 'ahorros', element: <SavingsPage /> },
          { path: 'categorias', element: <CategoriesPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
