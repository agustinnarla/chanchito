# Finanzas

App de finanzas personales (un solo usuario). Primero web, después mobile.
MVP: categorías, ingresos y gastos, balance mensual y presupuestos, en ARS y USD.

## Stack

- Monorepo con pnpm workspaces
- `apps/web`: Vite + React + TypeScript, Tailwind, shadcn/ui, TanStack Query, React Router
- `packages/core`: lógica de dominio, tipos y esquemas Zod. **Sin dependencias de UI ni de Supabase**, para reutilizarlo en `apps/mobile` (Expo) más adelante
- Supabase: Postgres, Auth y Row Level Security
- Tests: solo Vitest. Unitarios en `packages/core`; componentes en `apps/web` con jsdom + Testing Library y Supabase mockeado

## Comandos

- `pnpm install`
- `pnpm dev`: levanta `apps/web`
- `pnpm build`
- `pnpm test`: Vitest en todos los paquetes
- `pnpm lint`: ESLint + chequeo de formato con Prettier
- `pnpm typecheck`
- `pnpm format`: Prettier

## Cómo trabajamos (SDD)

1. Cada feature tiene su spec en `specs/NNN-nombre.md` (plantilla en `specs/_template.md`).
2. Antes de implementar, leer la spec y proponer un plan. Si algo es ambiguo, preguntar en vez de suponer.
3. Los criterios de aceptación se traducen en tests. La lógica de `packages/core` se escribe con tests primero.
4. Si durante la implementación cambia una decisión, actualizar la spec en el mismo commit.
5. Las decisiones de arquitectura van en `docs/decisions/` (ADRs cortos).
6. Commits pequeños, uno por tarea de la spec.

## Git y CI

Ver `docs/decisions/0003-git-y-ci.md`.

- Ramas: `main` (estable), `develop` (integración), `feature/NNN-nombre` (una por spec, PR a `develop`), `hotfix/*` si hace falta.
- Nunca commitear directo a `main` ni a `develop`. `develop` → `main` por PR, con tag `vX.Y.Z`.
- Merges siempre con merge commit (nunca squash ni rebase). Borrar la rama `feature/*` al mergear; nunca `develop`.
- Commits con Conventional Commits (`feat(core): ...`, `fix(web): ...`, `docs: ...`, `ci: ...`).
- El CI (GitHub Actions) corre lint, typecheck, test y build en cada PR. Antes de abrir un PR, correrlos localmente.

## Reglas de dominio (no romper)

- **Dinero siempre en enteros (centavos).** Nunca `number` con decimales ni `float` en la base. En Postgres, `bigint`.
- **Todo monto lleva su moneda** (`ARS` | `USD`). Nunca sumar montos de monedas distintas sin una conversión explícita.
- **El balance se calcula**, no se guarda.
- Toda la lógica de cálculo (balances, presupuestos, formateo de montos) vive en `packages/core` y tiene tests.
- Ver `docs/decisions/0002-dinero-y-monedas.md`.

## Seguridad

- Todas las tablas tienen RLS activado con políticas por `user_id = auth.uid()`.
- Nunca commitear claves. La `service_role` key de Supabase no se usa en el frontend.
- Variables de entorno en `.env.local` (ignorado por git), con `.env.example` de referencia.

## Convenciones

- TypeScript estricto. Nada de `any` salvo justificación.
- UI y mensajes en español (Argentina). Código, nombres de variables y commits en inglés.
- Fechas: guardar como `date` (sin hora) para movimientos. Mostrar en formato `dd/mm/aaaa`.
