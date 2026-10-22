# 014 — App mobile

**Estado:** en curso

## Objetivo

Tener Chanchito en el celular (Android) para cargar un gasto en el momento, sin abrir la web. Es la base para la spec 015, que va a leer las notificaciones de Mercado Pago y armar una bandeja de movimientos pendientes de confirmar, así no hace falta acordarse de cargar cada pago.

## Alcance

- `apps/mobile`: app Expo (React Native + TypeScript) con Expo Router, para Android
- Iniciar y cerrar sesión con la misma cuenta de la web (mail y contraseña)
- **Inicio:** un mes a la vez (por defecto, el actual) con ← →, totales del mes por moneda y la lista de movimientos del mes
- **Nuevo movimiento:** botón flotante que abre el formulario, con los mismos campos, valores por defecto y validaciones que en la web (spec 003)
- Tocar un movimiento permite editarlo o eliminarlo (con confirmación)
- Tema claro y oscuro según el sistema, con el estilo de la web: superficies tonales, verde neón, DM Sans y Geist Mono para montos, emojis Fluent 3D de las categorías
- `packages/data`: la capa de datos de categorías y movimientos pasa de `apps/web` a un paquete compartido entre web y mobile
- APK instalable generado con EAS Build (perfil `preview`)

### Fuera de alcance

- Leer notificaciones de Mercado Pago y bandeja de pendientes (spec 015)
- iOS y publicar en Play Store
- Crear, editar o archivar categorías; presupuestos, metas, apartado, bitcoin, gráficos de balance y apariencia (se siguen usando desde la web)
- Filtros del listado
- Modo offline: sin conexión, la app avisa y no guarda (como en la web; ver ADR 0001)
- Actualizaciones remotas (EAS Update): para una versión nueva se instala el APK nuevo
- Notificaciones push o recordatorios

## Modelo de datos

Sin cambios en la base.

`packages/data` (`@chanchito/data`): depende de `@chanchito/core` y de `@supabase/supabase-js`, nunca de UI. Las funciones reciben el cliente de Supabase en lugar de importarlo, porque web y mobile lo crean distinto (variables de entorno y dónde se guarda la sesión):

```ts
function createCategoriesApi(client: SupabaseClient<Database>): CategoriesApi
function createMovementsApi(client: SupabaseClient<Database>): MovementsApi
```

- `database.types.ts` se mueve a `packages/data` y `pnpm db:types` lo genera ahí.
- Los errores en español (`errors.ts`) y los `*.db.test.ts` de categorías y movimientos se mueven con su capa de datos.
- La web sigue igual por fuera: crea su cliente y usa estas funciones.

En mobile, el cliente de Supabase guarda la sesión con el `localStorage` de `expo-sqlite` (lo que recomienda Expo) y renueva el token cuando la app vuelve al primer plano. Las variables de entorno son `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`, validadas con Zod como en la web.

## Comportamiento

### Sesión

- Sin sesión, la app muestra la pantalla de ingreso: mail, contraseña y **Ingresar**. Los errores, en español y como en la web.
- La sesión queda guardada: al abrir la app de nuevo, entra directo a Inicio.
- **Cerrar sesión** desde un menú en Inicio vuelve a la pantalla de ingreso.

### Inicio

- Arriba, el mes ("Octubre 2026") con ← →.
- Totales del mes por moneda (ingresos, gastos y resultado), calculados con `core` como en la web. Solo las monedas que tienen movimientos en el mes.
- Debajo, los movimientos del mes en el mismo orden y con el mismo formato que la web: emoji y nombre de la categoría, descripción, fecha `dd/mm/aaaa` y monto (`-$ 1.234,56`, `+US$ 100,00`).
- Mes sin movimientos: "No hay movimientos en octubre 2026."
- Deslizar hacia abajo actualiza los datos (por si se cargó algo desde la web).

### Nuevo movimiento, editar y eliminar

- El botón flotante **Nuevo movimiento** abre el formulario a pantalla completa: tipo (Gasto por defecto), monto, moneda (ARS por defecto), fecha (hoy, fecha local; selector nativo de fecha), categoría (activas del tipo elegido, con emoji) y descripción opcional.
- El teclado del monto es numérico con coma decimal, y el monto se interpreta con `parseMoney`.
- Al guardar, vuelve a Inicio, muestra "Movimiento guardado" y el listado se actualiza.
- Tocar un movimiento abre el mismo formulario con sus datos y un botón **Eliminar** que pide confirmación.
- Las reglas de categoría archivada al editar son las de la spec 003.
- Si no hay categorías del tipo elegido, el formulario lo dice y explica que se crean desde la web.

## Criterios de aceptación

- [ ] Con mail y contraseña correctos se entra a Inicio; con datos incorrectos se ve el error en español y no se entra
- [ ] Al cerrar y abrir la app, la sesión sigue activa
- [ ] Cerrar sesión vuelve a la pantalla de ingreso
- [ ] Inicio muestra el mes actual con sus totales por moneda y sus movimientos ordenados por fecha descendente
- [ ] ← y → cambian de mes y actualizan totales y lista
- [ ] "Nuevo movimiento" abre el formulario con Gasto, ARS y la fecha de hoy preseleccionados
- [ ] Cargar un gasto de `1.234,56` ARS lo muestra en Inicio como `-$ 1.234,56` y actualiza los totales
- [ ] Un monto vacío, `0` o con más de 2 decimales muestra el error de `parseMoney` y no se guarda
- [ ] Sin categoría elegida, no se guarda y lo indica
- [ ] Editar un movimiento actualiza la lista; si cambia la fecha a otro mes, desaparece del mes que se está viendo
- [ ] Eliminar pide confirmación y quita el movimiento
- [ ] Un movimiento cargado desde el celular aparece en la web y viceversa (después de actualizar)
- [ ] La web sigue pasando todos sus tests después de mover la capa de datos a `packages/data`
- [ ] `packages/core` sigue sin depender de UI ni de Supabase
- [ ] El APK del perfil `preview` se instala en un Android y funciona contra el Supabase en la nube

## Casos borde

- "Hoy" es la fecha local, no UTC (como en la spec 003)
- Sin conexión: al guardar, error en español sin perder lo escrito; al abrir, error con opción de reintentar
- Token vencido mientras la app estaba en segundo plano: se renueva solo al volver; si la sesión ya no es válida, vuelve a la pantalla de ingreso
- Botón Atrás de Android: en el formulario lo cierra sin guardar (si hay algo escrito, pide confirmación); en Inicio sale de la app
- Montos grandes (`1.000.000.000,00`) se ven completos y no rompen la fila
- Categoría archivada en la web mientras el formulario está abierto: al guardar, el error de la base se muestra en español

## Tareas

- [x] Spec 014 y ADR 0005 (app mobile: estructura, capa de datos compartida, tests y distribución)
- [x] `packages/data`: mover la capa de datos de categorías y movimientos, sus errores, `database.types.ts` y sus tests de integración; la web pasa a usarla
- [x] `apps/mobile`: proyecto Expo en el monorepo (pnpm, TypeScript estricto, ESLint, Prettier), cliente de Supabase y variables de entorno
- [x] `apps/mobile`: tema (colores, tipografías, emojis Fluent 3D) y componentes base
- [ ] `apps/mobile`: ingreso, sesión persistente y cerrar sesión
- [ ] `apps/mobile`: Inicio con mes, totales y lista
- [ ] `apps/mobile`: formulario para cargar, editar y eliminar movimientos
- [ ] CI: lint, typecheck y tests de mobile en el job `ci`
- [ ] EAS Build: perfil `preview` (APK), instrucciones en el README y prueba en el celular
- [ ] PR a `develop`

## Decisiones y notas

- Primera versión mínima: lo que hace falta para cargar desde el celular. El resto se sigue usando desde la web.
- Solo Android, porque la spec 015 necesita leer notificaciones de otras apps y iOS no lo permite.
- La API de Mercado Pago se descartó para la carga automática: está pensada para cobrar y no documenta cómo listar los pagos que hace una cuenta personal.
- Capa de datos compartida en `packages/data` en lugar de duplicarla en mobile: los errores en español y los tests de integración quedan en un solo lugar. `core` sigue sin Supabase, como pide el ADR 0001.
- APK con EAS Build: compila en la nube de Expo y no hace falta instalar Android Studio. Las variables de entorno van en los perfiles de EAS, nunca en el repo.
- Las pantallas de mobile se testean con Jest (`jest-expo`), como excepción al "solo Vitest" del ADR 0004: Vitest no soporta bien React Native. Ver ADR 0005.
- Los emojis de categorías se leen de `apps/web/public/emoji`, sin copiarlos: un emoji nuevo en `CATEGORY_EMOJIS` sin imagen hace fallar el typecheck de mobile. Los colores son una copia de los de `index.css` (solo la paleta verde) y hay que mantenerlos a la par.
- Las fuentes se cargan con `@expo-google-fonts` (DM Sans y Geist Mono estáticas, una familia por peso, porque Android no elige el peso de una fuente propia con `fontWeight`).
