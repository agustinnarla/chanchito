import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '@/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function redirectTarget(state: unknown): string {
  if (state && typeof state === 'object' && 'from' in state && typeof state.from === 'string') {
    return state.from
  }
  return '/'
}

export function LoginPage() {
  const { session, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
      void navigate(target, { replace: true })
    } else {
      setError(result.message)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl">Iniciar sesión</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
