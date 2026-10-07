# 001 — Setup del proyecto

**Estado:** borrador

## Objetivo

Dejar la base lista para desarrollar features: monorepo, app web vacía con login, paquete de dominio con tests y Supabase configurado. Al terminar, puedo iniciar sesión y ver una pantalla vacía protegida.

## Alcance

- Monorepo con pnpm workspaces: `apps/web` y `packages/core`
- `apps/web`: Vite + React + TypeScript estricto, Tailwind, shadcn/ui, React Router, TanStack Query
- `packages/core`: TypeScript + Vitest, importable desde `apps/web`
- Utilidades de dinero en `packages/core` (ver abajo), con tests
- Proyecto de Supabase y cliente configurado en `apps/web` con variables de entorno
- Login con email (magic link o contraseña) para un solo usuario
- Ruta protegida: sin sesión redirige a `/login`
- Layout base: barra de navegación con enlaces vacíos a Movimientos, Balance, Presupuestos y Categorías
- ESLint + Prettier, scripts `dev`, `build`, `test`, `lint`, `typecheck` en la raíz
- `.env.example`, `.gitignore`, repositorio git inicializado

### Fuera de alcance

- Tablas de dominio (categorías, movimientos, presupuestos): van en sus specs
- Registro público de usuarios (el usuario se crea desde el panel de Supabase)
- Deploy (se decide aparte)
- `apps/mobile`

## Modelo de datos

Ninguna tabla propia todavía. Solo `auth.users` de Supabase.

En `packages/core`:

```ts
type Currency = 'ARS' | 'USD'

type Money = {
  amount: number   // entero, en centavos
  currency: Currency
}
```

## Comportamiento

### Utilidades de dinero (`packages/core`)

- `parseMoney(input: string, currency)`: convierte lo que escribe el usuario ("1.234,56", "1234.56", "1234") a centavos. Acepta coma o punto como separador decimal y máximo 2 decimales.
- `formatMoney(money)`: muestra con formato argentino. ARS → `$ 1.234,56`, USD → `US$ 1.234,56`.
- `addMoney(a, b)`: suma dos montos de la misma moneda. Si las monedas difieren, lanza error.
- `sumByCurrency(list)`: agrupa y suma por moneda → `{ ARS: Money, USD: Money }`.

### Autenticación

- `/login` con formulario de email.
- Al iniciar sesión, redirige a `/`.
- Botón de cerrar sesión en el layout.

## Criterios de aceptación

- [ ] `pnpm install && pnpm dev` levanta la web sin errores
- [ ] `pnpm test`, `pnpm lint` y `pnpm typecheck` pasan en la raíz
- [ ] Sin sesión, entrar a `/` redirige a `/login`
- [ ] Con credenciales válidas, llego a `/` y veo el layout con la navegación
- [ ] Cerrar sesión me devuelve a `/login`
- [ ] `apps/web` importa y usa `formatMoney` desde `packages/core`
- [ ] `parseMoney("1.234,56", "ARS")` → `{ amount: 123456, currency: "ARS" }`
- [ ] `parseMoney("1234.5", "USD")` → `{ amount: 123450, currency: "USD" }`
- [ ] `parseMoney("12,345", ...)` → error (más de 2 decimales)
- [ ] `addMoney` con monedas distintas lanza error
- [ ] `.env.local` no se commitea; `.env.example` sí

## Casos borde

- `parseMoney` con input vacío, negativo, letras o solo separadores → error claro
- Ambigüedad "1.234": se interpreta como mil doscientos treinta y cuatro (punto de miles). Documentar la regla elegida en los tests.
- Montos grandes (ej. 1.000.000.000,00) no pierden precisión

## Tareas

Se completan al planificar.

## Decisiones y notas

- Ver `docs/decisions/0001-stack.md` y `docs/decisions/0002-dinero-y-monedas.md`.
