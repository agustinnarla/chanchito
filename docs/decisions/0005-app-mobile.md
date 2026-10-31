# 0005 — App mobile

**Estado:** aceptada

## Contexto

La spec 014 suma una app para Android, y la spec 015 va a leer las notificaciones de Mercado Pago para cargar los pagos sin depender de la memoria. El ADR 0001 ya preveía Expo y un `core` compartido, pero no decía dónde vive la capa de datos, cómo se testean las pantallas en React Native ni cómo se instala la app.

## Decisión

### Estructura

- `apps/mobile`: Expo + React Native + TypeScript estricto, con Expo Router. Solo Android: iOS no deja leer notificaciones de otras apps, que es lo que justifica la app.
- `packages/data` (`@chanchito/data`): capa de datos compartida entre web y mobile (consultas a Supabase, errores en español y `database.types.ts`). Depende de `core` y de `@supabase/supabase-js`, nunca de UI. Las funciones reciben el cliente de Supabase, porque cada app lo crea con su configuración (variables de entorno y dónde se guarda la sesión).
- `packages/core` sigue sin UI ni Supabase.

### Tests

Se mantiene el ADR 0004, con una excepción: **las pantallas y componentes de `apps/mobile` se testean con Jest** (`jest-expo` + React Native Testing Library), porque Vitest no soporta bien React Native y `jest-expo` es lo que mantiene Expo.

| Qué                      | Dónde                               | Herramienta | Comando        |
| ------------------------ | ----------------------------------- | ----------- | -------------- |
| Pantallas y componentes  | `apps/mobile/src/**/*.test.tsx`     | Jest        | `pnpm test`    |
| Lógica de mobile sin UI  | `apps/mobile/src/**/*.test.ts`      | Jest        | `pnpm test`    |
| Capa de datos compartida | `packages/data/src/**/*.db.test.ts` | Vitest      | `pnpm test:db` |

- En `apps/mobile` todo va con Jest, para no tener dos runners en el mismo paquete.
- Las reglas de los tests de componentes son las del ADR 0004: se consulta por rol y por etiqueta, las interacciones con `userEvent`, se mockea en el borde de la capa de datos con fakes en memoria que respetan las reglas de la base, y sin snapshots.
- Los fakes en memoria de la capa de datos viven en `packages/data` para que los usen web y mobile.
- Cobertura mínima de `apps/mobile`: la misma que `web` (90% líneas, sentencias y funciones; 85% ramas), sin contar el arranque de la app ni la configuración.

### Distribución

- APK con EAS Build (perfil `preview`), instalado a mano en el celular. Sin Play Store.
- Las variables de entorno (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) se configuran en EAS y en `apps/mobile/.env.local`, nunca en el repo.
- El CI corre lint, typecheck y tests de mobile en el job `ci`. El APK se compila a mano con EAS, no en cada PR.

## Consecuencias

- Hay dos runners de tests en el repo. `pnpm test` y `pnpm test:coverage` siguen siendo un único comando desde la raíz.
- Mover la capa de datos a `packages/data` cambia dónde se genera `database.types.ts` y dónde viven los `*.db.test.ts` de las features que se mueven.
- Compilar con EAS requiere una cuenta de Expo (gratis) y depende de su servicio. Si deja de servir, se puede compilar en local con Android Studio.
- Para que una persona pruebe una versión nueva hay que instalarle el APK nuevo. EAS Update se reevalúa si eso se vuelve molesto.
