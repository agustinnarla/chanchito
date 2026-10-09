# 005 — Presupuestos

**Estado:** aprobada

## Objetivo

Ponerle un límite mensual a lo que gasto en cada categoría y ver, en el mes, cuánto llevo gastado y cuánto me queda, con un aviso cuando me acerco al límite o me paso. Pesos y dólares por separado (ver ADR 0002).

## Alcance

- Tabla `budgets` en Supabase con RLS
- Pantalla `/presupuestos`: un mes a la vez, con navegación entre meses en la URL (como Movimientos y Balance)
- Crear, editar el monto y eliminar presupuestos de un mes
- Copiar los presupuestos del mes anterior a un mes sin presupuestos
- Progreso de cada presupuesto con tres estados: bien, cerca del límite (80% o más) y excedido
- En `packages/core`: esquema del presupuesto, cálculo del progreso y su estado, y qué se copia del mes anterior

### Fuera de alcance

- Presupuesto total del mes (sin categoría)
- Presupuestos que se repiten solos o con vigencia
- Umbral de aviso configurable
- Presupuestos de ingresos
- Mostrar presupuestos en Inicio, Balance o el diálogo de movimiento
- Notificaciones fuera de la app

## Modelo de datos

```sql
-- categories: clave para la FK compuesta que obliga a que la categoría sea de gasto
alter table public.categories add constraint categories_id_user_id_kind_key unique (id, user_id, kind);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  category_kind public.category_kind not null default 'expense',
  month date not null,                 -- primer día del mes
  amount bigint not null,              -- centavos
  currency public.currency not null,
  created_at timestamptz not null default now(),

  -- La categoría es del mismo usuario y de gasto; si se borra, se borran sus presupuestos
  foreign key (category_id, user_id, category_kind)
    references public.categories (id, user_id, kind) on delete cascade,
  constraint budgets_expense_only check (category_kind = 'expense'),
  constraint budgets_month_first_day check (extract(day from month) = 1),
  constraint budgets_amount_positive check (amount > 0),
  constraint budgets_amount_safe check (amount <= 9007199254740991),
  -- Un presupuesto por categoría, mes y moneda
  constraint budgets_category_month_currency_key unique (user_id, category_id, month, currency)
);
-- RLS con user_id = auth.uid() y permisos por columna:
-- insert de (category_id, month, amount, currency); update solo de amount
```

En `packages/core`:

```ts
type Budget = {
  id: string
  month: Month // 'aaaa-mm'
  amount: Money // límite, > 0
  category: { id: string; name: string; archived: boolean }
}

type BudgetStatus = 'ok' | 'warning' | 'exceeded'

type BudgetProgress = {
  budget: Budget
  spent: Money // gastos del mes en esa categoría y moneda
  remaining: Money // amount - spent; negativo si se pasó
  ratio: number // spent / amount; puede pasar de 1
  status: BudgetStatus
}
```

## Comportamiento

### Cálculo

- **Gastado** = suma de los gastos del mes en esa categoría y en la moneda del presupuesto. Los gastos en otra moneda no cuentan.
- **Estado:**
  - **Bien:** gastado menor al 80% del presupuesto
  - **Cerca del límite:** del 80% al 100%, inclusive (gastar justo el presupuesto no es pasarse)
  - **Excedido:** gastado mayor al presupuesto
- La comparación con el 80% se hace con enteros, sin redondeos.

### Pantalla (`/presupuestos`)

- Muestra un mes; por defecto, el actual. Navegación ← → con el mes en la URL (`/presupuestos?mes=2026-10`).
- Una sección por moneda que tenga presupuestos ("Pesos", "Dólares"), con:
  - Un resumen: "Gastado $ 45.000,00 de $ 60.000,00" (suma de los presupuestos de esa moneda y de lo gastado en esas categorías).
  - Si hubo gastos en esa moneda en categorías sin presupuesto: "Además, $ 3.000,00 en categorías sin presupuesto."
  - Un presupuesto por fila, en orden alfabético de categoría, con:
    - Categoría (con "(archivada)" si corresponde)
    - "$ 45.000,00 de $ 60.000,00"
    - Barra de progreso (llena al 100% si se pasó)
    - Estado con ícono y texto: "Quedan $ 15.000,00" (bien), "Quedan $ 2.000,00 · Cerca del límite" (cerca) o "Te pasaste por $ 5.000,00" (excedido). El color acompaña, pero nunca es la única señal.
    - **Editar** y **Eliminar**
- **Nuevo presupuesto** abre un diálogo para el mes que se está viendo con:
  - **Categoría:** obligatoria; solo categorías de gasto activas, en orden alfabético
  - **Moneda:** ARS (por defecto) o USD
  - **Monto:** se escribe como en `parseMoney`; mayor a 0
  - Si ya hay un presupuesto para esa categoría y moneda en ese mes: "Ya hay un presupuesto en pesos para «Supermercado» en octubre 2026."
- **Editar** abre el mismo diálogo con solo el monto editable (categoría, moneda y mes fijos). Para cambiar otra cosa, se elimina y se crea otro.
- **Eliminar** pide confirmación.
- Mes sin presupuestos: "No hay presupuestos para octubre 2026."
  - Si el mes anterior tiene presupuestos, se ofrece **Copiar los de septiembre 2026**. Copia todos con el mismo monto, salvo los de categorías archivadas. Al terminar, avisa cuántos copió.
  - Si no, se ofrece crear el primero.
- Los gastos vienen de la misma consulta que Movimientos y Balance: cargar, editar o eliminar un movimiento actualiza el progreso.

## Criterios de aceptación

- [ ] `/presupuestos` muestra el mes actual; ← y → cambian de mes y actualizan la URL
- [ ] Con un presupuesto de `60.000` ARS en "Supermercado" y gastos de `45.000` ARS ahí en el mes, muestra "$ 45.000,00 de $ 60.000,00" y "Quedan $ 15.000,00"
- [ ] Al llegar al 80% (`48.000` de `60.000`), muestra "Cerca del límite"; con `60.000` justos, también
- [ ] Al pasar el presupuesto (`65.000` de `60.000`), muestra "Te pasaste por $ 5.000,00" y la barra llena
- [ ] Los gastos en USD no cuentan para un presupuesto en ARS, y los de otros meses o categorías tampoco
- [ ] Los ingresos no cuentan para ningún presupuesto
- [ ] El resumen por moneda suma presupuestos y gastado; los gastos en categorías sin presupuesto se informan aparte
- [ ] Crear un presupuesto lo agrega al mes que se está viendo
- [ ] Solo se ofrecen categorías de gasto activas
- [ ] Un monto vacío, `0`, negativo o con más de 2 decimales muestra el error de `parseMoney` y no se guarda
- [ ] Un segundo presupuesto para la misma categoría, mes y moneda muestra el error y no se guarda; en la otra moneda, sí
- [ ] Editar cambia solo el monto
- [ ] Eliminar pide confirmación y quita el presupuesto
- [ ] Un mes vacío con presupuestos en el mes anterior ofrece copiarlos; se copian todos menos los de categorías archivadas y avisa cuántos
- [ ] Cargar, editar o eliminar un movimiento actualiza el progreso sin recargar
- [ ] **RLS:** un usuario no puede ver, crear, modificar ni eliminar presupuestos de otro, ni asociarlos a una categoría de otro
- [ ] **Base:** rechaza presupuestos de categorías de ingreso, montos ≤ 0 o mayores a `Number.MAX_SAFE_INTEGER`, meses que no empiezan el día 1 y duplicados por categoría, mes y moneda
- [ ] **Base:** no se puede cambiar la categoría, el mes ni la moneda de un presupuesto
- [ ] **Base:** al borrar una categoría (sin movimientos), se borran sus presupuestos
- [ ] La migración está aplicada en el proyecto en la nube

## Casos borde

- Gastado exactamente el 80% o el 100% del presupuesto: "Cerca del límite", no "Excedido"
- Presupuesto con gastos en cero: "Quedan" el monto completo, barra vacía
- Montos grandes cerca de `Number.MAX_SAFE_INTEGER`: el 80% se compara sin perder precisión
- Una categoría archivada con presupuesto en el mes se sigue mostrando, con "(archivada)"; no se ofrece para crear nuevos ni se copia
- Copiar a un mes que ya tiene algún presupuesto: no se ofrece
- Copiar de diciembre a enero (cambio de año)
- Un `?mes=` inválido en la URL muestra el mes actual
- Una categoría eliminada en otra pestaña mientras se crea un presupuesto: error claro, sin romper la pantalla

## Tareas

- [x] Spec 005
- [x] `core`: esquema del presupuesto, progreso y estado, resumen por moneda y presupuestos a copiar
- [x] Migración: tabla `budgets` con RLS y permisos por columna
- [x] Tests de base: RLS y restricciones de `budgets`
- [x] `web`: capa de datos de presupuestos (con tests contra Supabase local) y fake en memoria
- [x] `web`: pantalla de presupuestos: mes en la URL, listado con progreso y resumen por moneda
- [ ] `web`: crear, editar y eliminar presupuestos
- [ ] `web`: copiar los presupuestos del mes anterior
- [ ] Aplicar la migración en la nube, PR a `develop`

## Decisiones y notas

- Un presupuesto por categoría, mes y moneda, como dice el ADR 0002. Sin vigencias: cada mes tiene los suyos y se copian del anterior en un clic. Es explícito y el modelo queda simple.
- Solo categorías de gasto: la FK compuesta `(category_id, user_id, category_kind)` contra `categories (id, user_id, kind)`, con `category_kind` fijo en `'expense'`, lo garantiza en la base. Como el `kind` de una categoría no se puede cambiar (spec 002), no hay forma de que deje de cumplirse.
- `on delete cascade` en la categoría: una categoría sin movimientos se puede borrar, y sus presupuestos se van con ella. Una con movimientos se archiva (spec 003) y conserva sus presupuestos.
- El mes se guarda como `date` del día 1, igual que las fechas de movimientos; en `core` es `Month` (`'aaaa-mm'`).
- Solo el monto es editable: cambiar categoría, mes o moneda es en la práctica otro presupuesto.
- El progreso se calcula en el cliente, en `core`, con los movimientos del mes que ya trae la consulta de Movimientos, como el balance.
- Los colores de los estados son de estado (bien, advertencia, crítico), distintos de los de gastos e ingresos del Balance, y siempre van con ícono y texto.
