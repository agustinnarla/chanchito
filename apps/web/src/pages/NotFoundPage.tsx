import { Link } from 'react-router'
import { Panel } from '@/components/Panel'

export function NotFoundPage() {
  return (
    <Panel className="space-y-3">
      <h1 className="text-xl font-semibold">Página no encontrada</h1>
      <p className="text-muted-foreground">La dirección no corresponde a ninguna sección.</p>
      <Link to="/" className="inline-block font-semibold text-income hover:underline">
        Ir a Inicio
      </Link>
    </Panel>
  )
}
