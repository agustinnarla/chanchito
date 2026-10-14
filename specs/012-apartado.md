# 012 — Lo apartado: ahorro e inversión en el balance y en Movimientos

**Estado:** hecha

## Objetivo

Que el número principal del mes sea lo que realmente te queda: lo que pusiste en metas de ahorro (spec 009) y en bitcoin (spec 010) se descuenta, pero cuenta como lo que es, ahorro o inversión, y nunca como gasto. Y que esos aportes, retiros y compras se vean en Movimientos junto con los ingresos y gastos.

## Alcance

- Inicio y Balance: el número principal pasa a ser **Te queda** (ingresos − gastos − ahorro − inversión), con el detalle debajo
- Movimientos e Inicio ("Últimos movimientos"): los aportes, retiros y compras de bitcoin aparecen en la lista del mes, marcados como **Ahorro** o **Inversión**
- Filtro de tipo en Movimientos: Gasto, Ingreso y **Ahorro e inversión**

### Fuera de alcance

- Cargar o editar aportes y compras desde Movimientos (se hace en Ahorros; desde Movimientos se llega con un enlace)
- Contar ahorro e inversión en el desglose por categoría de Balance o en los presupuestos
- Cambios en la base de datos

## Modelo de datos

Sin cambios en la base. En `packages/core`:

```ts
/** Lo que se aparta del mes, por moneda: aportes − retiros y compras de bitcoin. */
type SetAside = { saved: Money; invested: Money }

/** El resultado del mes con lo apartado: ingresos − gastos − ahorro − inversión. */
function leftThisMonth(summary: CurrencySummary, setAside: SetAside): Money

/** Una fila de la lista del mes: un movimiento, un aporte o retiro, o una compra de bitcoin. */
type MonthEntry =
  | { kind: 'movement'; movement: Movement }
  | { kind: 'saving'; contribution: Contribution; goal: Pick<SavingsGoal, 'id' | 'name' | 'emoji'> }
  | { kind: 'investment'; purchase: CryptoPurchase }

/** Junta movimientos, aportes y compras del mes, del más nuevo al más viejo. */
function monthEntries(movements, contributions, goals, purchases, month): MonthEntry[]
function filterEntries(entries, filters): MonthEntry[] // el tipo 'set-aside' deja solo ahorro e inversión
function groupEntriesByDay(entries): EntryDay[]
function formatEntryAmount(entry): string // "-$ 800,00" lo que sale, "+$ 100,00" un retiro
```

`MovementFilters.kind` suma `'set-aside'` (en la URL, `?tipo=ahorro`).

## Comportamiento

### Te queda

- **Inicio:** el número grande pasa a ser "Te queda" en la moneda elegida. Debajo, los chips Ingresos, Gastos y, si hubo, Ahorraste e Invertiste. La etiqueta del estado (spec 008) sigue al lado.
- **Balance:** los bloques pasan a ser Ingresos, Gastos, Ahorraste, Invertiste y **Te queda** (destacado). "Resultado" (ingresos − gastos) se mantiene como dato secundario debajo de Te queda: "Resultado sin contar ahorro e inversión: +$ 754.600".
- Sin ahorro ni inversión en el mes, Te queda es igual al resultado y no se muestran Ahorraste ni Invertiste.
- Los retiros de una meta suman a Te queda (la plata vuelve a estar disponible).
- Pesos y dólares nunca se mezclan: cada moneda tiene su Te queda.
- El estado del chanchito (spec 008) sigue usando el resultado: "te pasaste" es gastar más de lo que entró, no ahorrar.

### Movimientos

- La lista del mes, agrupada por día, suma:
  - **Aporte:** el emoji de la meta en su forma, "Ahorro · Celular nuevo", y el monto en el color de texto secundario con signo menos ("−$ 80.000,00").
  - **Retiro:** "Retiro · Celular nuevo", con signo más.
  - **Compra de bitcoin:** la moneda 🪙, "Inversión · Bitcoin", la cantidad ("0,001 BTC en Binance") y el monto con signo menos.
- Estas filas no tienen el menú ⋮ de editar y eliminar: tienen un enlace "Ver en Ahorros".
- **Filtros:** el tipo suma "Ahorro e inversión". En celular, el tipo es un selector desplegable como moneda y categoría (cuatro opciones no entran en el ancho). Al filtrar por categoría o por "Gasto"/"Ingreso", no aparecen. El filtro de moneda las incluye.
- **Inicio:** "Últimos movimientos" muestra los 6 más recientes del mes, incluidos aportes y compras (sin el enlace, como las demás filas de Inicio, que no tienen acciones).
- Un mes con solo ahorro o inversión (sin ingresos ni gastos) ya no es un mes vacío para la lista, pero sí para el chanchito (spec 008).

## Criterios de aceptación

- [x] **core:** `leftThisMonth` resta ahorro e inversión del resultado y suma los retiros, por moneda
- [x] **core:** `monthEntries` junta movimientos, aportes y compras del mes, del día más nuevo al más viejo; en el mismo día, primero los movimientos (por hora de carga) y después aportes y compras
- [x] **core:** `filterEntries` aplica tipo, categoría y moneda; "Ahorro e inversión" deja solo esas filas
- [x] Inicio y Balance muestran Te queda como número principal y el detalle de ahorro e inversión
- [x] Movimientos muestra aportes, retiros y compras con su tipo, emoji, monto y enlace a Ahorros
- [x] El filtro "Ahorro e inversión" funciona y se guarda en la URL (`?tipo=ahorro`)
- [x] Los presupuestos y el desglose por categoría no cambian

## Casos borde

- Aporte en dólares a una meta en dólares: cuenta en Te queda de dólares, no de pesos
- Mes con más apartado que resultado: Te queda negativo ("−$ 50.000"), sin que el chanchito diga "te pasaste"
- Meta eliminada: sus aportes desaparecen de la lista (se borraron con ella)
- Mes sin movimientos pero con un aporte: la lista muestra el aporte

## Tareas

- [x] Spec 012
- [x] `core`: `leftThisMonth`, `monthEntries`, filtros y agrupación por día, con tests primero
- [x] `web`: Te queda en Inicio y Balance
- [x] `web`: aportes, retiros y compras en Movimientos e Inicio, y el filtro "Ahorro e inversión"
- [x] PR a `develop`

## Decisiones y notas

- Te queda como número principal (pedido): refleja la plata disponible. El resultado (ingresos − gastos) se mantiene como dato secundario porque es lo que mide si gastaste más de lo que entró.
- Las filas de ahorro e inversión se ven en Movimientos pero se editan en Ahorros: así cada cosa tiene un solo lugar donde se carga.
- No cuentan en presupuestos ni en el desglose por categoría: no son gastos.
- Verificado con capturas en el Supabase local (escritorio y celular, verde y azul): eso mostró que "Ahorro e inversión" no entraba en el selector segmentado y que el enlace desalineaba los montos en Inicio.
