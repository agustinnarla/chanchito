# 001 — Setup del proyecto

**Estado:** en curso

## Objetivo

Dejar la base lista para desarrollar features: monorepo, app web vacía con login, paquete de dominio con tests, Supabase configurado y flujo de trabajo en GitHub con CI. Al terminar, puedo iniciar sesión y ver una pantalla vacía protegida.

## Alcance

- Monorepo con pnpm workspaces: `apps/web` y `packages/core`
- `apps/web`: Vite + React + TypeScript estricto, Tailwind, shadcn/ui, React Router, TanStack Query
- `packages/core`: TypeScript + Vitest + Zod, importable desde `apps/web`
- Utilidades de dinero en `packages/core` (ver abajo), con tests
- Proyecto de Supabase (en la nube) y cliente configurado en `apps/web` con variables de entorno
- Login con email y contraseña para un solo usuario
- Ruta protegida: sin sesión redirige a `/login`
- Layout base: barra de navegación con enlaces vacíos a Movimientos, Balance, Presupuestos y Categorías
- ESLint + Prettier, scripts `dev`, `build`, `test`, `lint`, `typecheck` en la raíz
- `.env.example`, `.gitignore`, repositorio git inicializado
- Repositorio en GitHub con gitflow liviano y CI (GitHub Actions) que corre lint, typecheck, tests y build (ver `docs/decisions/0003-git-y-ci.md`)

### Fuera de alcance

- Tablas de dominio (categorías, movimientos, presupuestos): van en sus specs
- Supabase CLI y migraciones versionadas: se suman en la spec 002, con las primeras tablas
- Registro público de usuarios (el usuario se crea desde el panel de Supabase)
- Recuperar contraseña
- Deploy (se decide aparte)
- Tests end-to-end en navegador
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

Con sus esquemas Zod: `CurrencySchema` y `MoneySchema` (`amount` entero seguro, `currency` válida).

## Comportamiento

### Utilidades de dinero (`packages/core`)

- `parseMoney(input: string, currency)`: convierte lo que escribe el usuario a centavos. Regla de separadores:
  - Se ignoran los espacios al principio y al final.
  - La coma siempre es separador decimal, con 1 o 2 dígitos después. Puede haber solo una.
  - Si hay coma, los puntos de la parte entera son separadores de miles y deben formar grupos de 3 dígitos (`1.234,56`).
  - Si no hay coma, el punto es de miles cuando todos los grupos después del primero tienen exactamente 3 dígitos (`1.234`, `1.234.567`). Si no, un único punto es decimal (`1234.5`, `1234.56`).
  - El formato de EE.UU. con los dos separadores (`1,234.56`) da error.
  - Tiene que haber al menos un dígito antes del separador decimal (`,5` da error).
  - El parseo es sobre el string, sin aritmética de punto flotante.
- `formatMoney(money)`: muestra con formato argentino. ARS → `$ 1.234,56`, USD → `US$ 1.234,56`, negativos → `-$ 1.234,56`. Usa espacio normal (no `Intl`), para que el resultado sea igual en todos los entornos.
- `addMoney(a, b)`: suma dos montos de la misma moneda. Si las monedas difieren, lanza error.
- `sumByCurrency(list)`: agrupa y suma por moneda → `{ ARS: Money, USD: Money }`. Siempre devuelve las dos monedas (en 0 si no hay montos de esa moneda).

### Autenticación

- `/login` con formulario de email y contraseña.
- Credenciales incorrectas → mensaje de error en español.
- Al iniciar sesión, redirige a `/`.
- Botón de cerrar sesión en el layout.

## Criterios de aceptación

- [ ] `pnpm install && pnpm dev` levanta la web sin errores
- [ ] `pnpm test`, `pnpm lint`, `pnpm typecheck` y `pnpm build` pasan en la raíz
- [ ] Sin sesión, entrar a `/` redirige a `/login`
- [ ] Con credenciales válidas, llego a `/` y veo el layout con la navegación
- [ ] Con credenciales incorrectas, veo un mensaje de error y sigo en `/login`
- [ ] Cerrar sesión me devuelve a `/login`
- [ ] `apps/web` importa y usa `formatMoney` desde `packages/core`
- [ ] `parseMoney("1.234,56", "ARS")` → `{ amount: 123456, currency: "ARS" }`
- [ ] `parseMoney("1234.5", "USD")` → `{ amount: 123450, currency: "USD" }`
- [ ] `parseMoney("1.234", "ARS")` → `{ amount: 123400, currency: "ARS" }`
- [ ] `parseMoney("12,345", ...)` → error (más de 2 decimales)
- [ ] `parseMoney("1,234.56", ...)` → error (formato no argentino)
- [ ] `formatMoney({ amount: -123456, currency: "ARS" })` → `-$ 1.234,56`
- [ ] `addMoney` con monedas distintas lanza error
- [ ] `sumByCurrency([])` → `{ ARS: 0 ARS, USD: 0 USD }`
- [ ] `.env.local` no se commitea; `.env.example` sí
- [ ] Cada PR a `develop` o `main` corre el CI (lint, typecheck, test, build)
- [ ] `main` y `develop` están protegidas: no aceptan push directo y exigen el CI en verde

## Casos borde

- `parseMoney` con input vacío, negativo, letras o solo separadores → error claro
- Ambigüedad "1.234": se interpreta como mil doscientos treinta y cuatro (punto de miles). La regla está documentada en los tests.
- Montos grandes (ej. 1.000.000.000,00) no pierden precisión. Si el resultado excede `Number.MAX_SAFE_INTEGER` centavos, error.
- `"0"` es válido (`{ amount: 0 }`). Si un movimiento puede valer 0 se decide en la spec 003.

## Tareas

- [ ] Inicializar git, importar docs, crear `develop` y `feature/001-setup`, publicar en GitHub
- [x] Actualizar spec, ADR 0003 y `CLAUDE.md`
- [ ] Esqueleto del monorepo (workspace, tsconfig, ESLint, Prettier, scripts)
- [ ] Workflow de CI y template de PR
- [ ] `core`: tipos y esquemas Zod de dinero
- [ ] `core`: `parseMoney`
- [ ] `core`: `formatMoney`
- [ ] `core`: `addMoney` y `sumByCurrency`
- [ ] `web`: scaffold (Vite, Tailwind, shadcn/ui, router, TanStack Query) usando `formatMoney`
- [ ] `web`: cliente de Supabase y `.env.example`
- [ ] `web`: login, ruta protegida y logout, con tests
- [ ] `web`: layout con navegación
- [ ] PR a `develop`, protección de ramas, release `v0.1.0` a `main`

## Decisiones y notas

- Ver `docs/decisions/0001-stack.md`, `docs/decisions/0002-dinero-y-monedas.md` y `docs/decisions/0003-git-y-ci.md`.
- Login con contraseña en vez de magic link: no depende de que llegue un mail, es más simple de probar y funciona igual en mobile sin deep links.
- Supabase en la nube, sin Docker por ahora: la spec no tiene tablas propias. Se reevalúa en la spec 002 (probar RLS en CI).
- Zod se suma desde esta spec para dejar el patrón de esquemas en `core`.
- Los tests son solo con Vitest (también en `apps/web`, con jsdom y Testing Library). Se descartan los tests en navegador por ahora.
