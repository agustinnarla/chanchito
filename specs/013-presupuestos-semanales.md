# 013 — Presupuestos semanales

**Estado:** aprobada

## Objetivo

Poder poner un límite por semana a una categoría de gasto (por ejemplo, "Supermercado: $ 40.000 por semana"), además de los presupuestos mensuales de la spec 005, que siguen igual. Las semanas van de lunes a domingo.

## Alcance

- Presupuestos semanales por categoría de gasto y moneda, que se repiten todas las semanas hasta que se eliminan
- En Presupuestos, una sección **Esta semana** con su navegación (← semana →), arriba de los mensuales
- En Inicio, los semanales de la semana actual entran en "Tus presupuestos" y en el estado del chanchito
- Una categoría puede tener presupuesto mensual y semanal a la vez

### Fuera de alcance

- Presupuestos por día, quincena o año
- Que el monto semanal cambie según la semana (es el mismo todas las semanas; si se edita, cambia para todas)
- Elegir el día en que empieza la semana (siempre lunes)

## Modelo de datos

```sql
create table public.weekly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  category_kind public.category_kind not null default 'expense', -- como en budgets: solo gasto
  amount bigint not null,              -- centavos, > 0, ≤ MAX_SAFE_INTEGER
  currency public.currency not null,
  created_at timestamptz not null default now(),
  foreign key (category_id, user_id, category_kind)
    references public.categories (id, user_id, kind) on delete cascade,
  unique (user_id, category_id, currency)
);
-- RLS por user_id = auth.uid(). Solo se puede cambiar el monto.
```

En `packages/core`:

```ts
type Week = IsoDate // el lunes de la semana: '2026-10-12'
function weekOf(date: IsoDate): Week // el lunes de esa semana
function addWeeks(week: Week, delta: number): Week
function weekRange(week: Week): { from: IsoDate; to: IsoDate } // lunes a lunes siguiente (exclusivo)
function parseWeek(value, fallback): Week // cualquier fecha válida da su semana
function currentWeek(now?): Week
function formatWeekLabel(week: Week): string // "Semana del 12 al 18 de octubre", "del 29 de septiembre al 5 de octubre"

type WeeklyBudget = {
  id
  amount: Money
  category: Pick<MovementCategory, 'id' | 'name' | 'archived' | 'emoji'>
}
function weeklyBudgetProgress(budget, movements, week): BudgetProgress // mismo cálculo y estados que la spec 005
function summarizeWeeklyBudgets(budgets, movements, week): Record<Currency, CurrencyBudgets>
```

Los gastos de una semana que cruza dos meses se leen de los dos meses.

## Comportamiento

### Presupuestos

- Arriba, **Esta semana**: "← Semana del 12 al 18 de octubre →", cada presupuesto semanal con su emoji, "Gastado $ X de $ Y", barra, estado (ok, cerca del límite al 80 %, te pasaste) y menú ⋮ (Editar, Eliminar). "Nuevo presupuesto semanal".
- Debajo, los mensuales como hoy, con su navegación de mes.
- Cambiar de semana no cambia el mes que se está viendo, y viceversa. La semana se guarda en la URL (`?semana=2026-10-12`).
- Sin presupuestos semanales: "Todavía no tenés presupuestos semanales" y el botón para crear uno.

### Crear y editar

- El diálogo de presupuesto suma un selector **Por mes | Por semana**. Por semana: categoría de gasto, moneda y monto, sin mes.
- Una categoría y moneda pueden tener un semanal (único) y además mensuales.
- Editar cambia solo el monto, para todas las semanas.

### Inicio y el chanchito

- "Tus presupuestos" (spec 008) suma los semanales de la semana actual, con la marca "semana" o "mes" en cada fila; se siguen mostrando hasta 3, primero los pasados.
- El estado del chanchito tiene en cuenta los semanales de la semana actual cuando se mira el mes actual: "Te pasaste en Supermercado esta semana. Tranqui, el lunes arranca una nueva." / "Ojo: Supermercado ya va por el 82% esta semana." Si hay un mensual y un semanal en el mismo estado, se nombra el de mayor porcentaje (a igualdad, el mensual).

## Criterios de aceptación

- [ ] **core:** `weekOf` devuelve el lunes de cualquier día (incluido domingo y lunes); `addWeeks` cruza meses y años
- [ ] **core:** `formatWeekLabel` nombra semanas dentro de un mes y entre dos meses o años
- [ ] **core:** el progreso semanal suma solo los gastos de esa semana, categoría y moneda, con los mismos estados que la spec 005
- [ ] **Base:** RLS; solo categorías de gasto; un semanal por categoría y moneda; solo el monto se puede cambiar; borrar la categoría borra sus semanales
- [ ] Presupuestos muestra Esta semana con su navegación, y los mensuales siguen igual
- [ ] Crear, editar y eliminar un presupuesto semanal
- [ ] Inicio y el chanchito tienen en cuenta los semanales de la semana actual

## Casos borde

- Semana que cruza meses (29/9 al 5/10): suma los gastos de los dos meses
- Categoría archivada con presupuesto semanal: se sigue mostrando, marcada "(archivada)"
- Gasto del domingo: cuenta para la semana que empezó el lunes anterior
- Mismo nombre de categoría con mensual y semanal: en Inicio se distinguen por la marca "semana" o "mes"

## Tareas

- [x] Spec 013
- [x] `core`: semanas (`weekOf`, `addWeeks`, `weekRange`, `formatWeekLabel`) y progreso semanal, con tests primero
- [x] Migración: `weekly_budgets` con sus restricciones y RLS; tests de base
- [x] `web`: capa de datos de semanales, con sus tests contra Supabase local y su fake
- [x] `web`: sección Esta semana en Presupuestos y el diálogo Por mes | Por semana
- [x] `web`: semanales en Inicio y en el estado del chanchito
- [ ] Aplicar la migración en la nube, PR a `develop`

## Decisiones y notas

- Los semanales se repiten solos todas las semanas (no hay que crearlos ni copiarlos cada semana, a diferencia de los mensuales): un límite semanal es, por naturaleza, el mismo cada semana.
- Tabla aparte y no una columna "periodo" en `budgets`: los mensuales tienen mes y se copian; los semanales no tienen fecha. Mezclarlos complicaría las restricciones únicas y el código de la spec 005.
- Semana de lunes a domingo (pedido), como en Argentina.
