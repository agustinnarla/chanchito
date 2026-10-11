# 0004 — Testing

**Estado:** aceptada

## Contexto

Los criterios de aceptación de cada spec se traducen en tests, pero hasta la spec 002 no estaba escrito qué tipo de test va en cada capa. La capa de datos del frontend (`api.ts`) quedó sin tests automáticos y no se medía la cobertura.

## Decisión

Todo con **Vitest**. Cuatro tipos de test, cada uno en su capa:

| Qué                            | Dónde                            | Contra qué               | Comando        |
| ------------------------------ | -------------------------------- | ------------------------ | -------------- |
| Lógica de dominio              | `packages/core/src/**/*.test.ts` | Nada (funciones puras)   | `pnpm test`    |
| Componentes y pantallas        | `apps/web/src/**/*.test.tsx`     | Fakes en memoria (jsdom) | `pnpm test`    |
| Capa de datos del frontend     | `apps/web/src/**/*.db.test.ts`   | Supabase local           | `pnpm test:db` |
| RLS y restricciones de la base | `supabase/tests/*.test.ts`       | Supabase local           | `pnpm test:db` |

### Reglas por tipo

- **`core`:** tests primero (TDD). Cada regla de dominio y cada caso borde de la spec tiene su test.
- **Componentes:**
  - Se consulta como lo haría una persona: por rol y por etiqueta (`getByRole`, `getByLabelText`), nunca por clases ni por `data-testid`. Si no se puede encontrar algo así, es un problema de accesibilidad del componente.
  - Las interacciones van con `userEvent`, no con `fireEvent`.
  - Se mockea en el borde de la capa de datos (`features/*/api.ts`) con un **fake en memoria que respeta las mismas reglas que la base** (por ejemplo, `src/test/fake-categories-api.ts`). Para la autenticación, el fake es de `supabase.auth` (`src/test/fake-supabase-auth.ts`).
  - Sin snapshots.
- **Capa de datos (`*.db.test.ts`):** cada función de `api.ts` se prueba contra Supabase local con un usuario de prueba nuevo, incluidos los mensajes de error en español y el comportamiento sin sesión.
- **Base:** cada tabla nueva tiene tests de que otro usuario no puede leer ni escribir sus filas, que sin sesión no hay acceso y que se cumplen sus restricciones.
- Los usuarios de prueba se crean y se borran con `@chanchito/supabase/testing`, que usa la clave admin del Supabase **local**. Nunca se usa en la app.

### Cobertura

Se mide con `@vitest/coverage-v8` y el CI falla si baja de estos mínimos:

| Paquete               | Mínimo                                        |
| --------------------- | --------------------------------------------- |
| `core`                | 95% en todo                                   |
| `web` (unitarios)     | 90% líneas, sentencias y funciones; 85% ramas |
| `web` (capa de datos) | 90% líneas, sentencias y funciones; 85% ramas |

Se excluye código generado (`components/ui`, `database.types.ts`) y el arranque de la app (`main.tsx`, `App.tsx`, `router.ts`). Los `api.ts` se excluyen de la cobertura unitaria porque se miden en la de integración.

La cobertura es una alarma, no el objetivo: un test que solo sube el porcentaje sin verificar comportamiento no suma.

## Consecuencias

- Cada spec nueva con datos suma: tests de base (RLS), tests de su `api.ts` contra Supabase local, un fake en memoria para los tests de componentes y tests de pantalla.
- Si cambia una regla de la base, hay que actualizar también el fake en memoria; los tests de integración muestran si el fake y la base dejan de coincidir.
- `pnpm test` sigue siendo rápido y sin Docker. `pnpm test:db` requiere `pnpm db:start`.
- Los tests en navegador real (Playwright) siguen fuera; se reevalúan si aparecen flujos que no se puedan probar con jsdom.
