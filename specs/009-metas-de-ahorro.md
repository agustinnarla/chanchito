# 009 — Metas de ahorro

**Estado:** aprobada

## Objetivo

Separar plata para algo concreto (por ejemplo, un celular) y ver cuánto falta, sin que ahorrar cuente como gastar. La meta puede tener su objetivo en dólares aunque se ahorre en pesos: la app convierte con el dólar MEP del día. Diseño aprobado en el lienzo [Chanchito: direcciones visuales](https://claude.ai/artifact/CNYYPFqzfhaC26HSfSmWEa), fila "Ahorros" (E1 y E2).

## Alcance

- Sección **Ahorros** en la navegación, con los totales guardados por moneda y la lista de metas
- Metas: nombre, emoji, objetivo (monto y moneda) y moneda en la que se ahorra
- Aportes y retiros de una meta, con fecha
- Cotización del dólar MEP del día, automática, para metas con objetivo en otra moneda
- Los aportes del mes se muestran en Inicio y en Balance, separados de los gastos
- Cambio de navegación: "Ahorros" en el menú; en celular, "Más" agrupa Presupuestos y Categorías

### Fuera de alcance

- Inversiones (spec 010)
- Fecha objetivo y "cuánto ahorrar por mes"
- Convertir los totales a una sola moneda (patrimonio total)
- Otras cotizaciones además del MEP, o cargarla a mano
- Mover plata entre metas

## Modelo de datos

```sql
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,                       -- 1 a 40 caracteres, único por usuario (sin distinguir mayúsculas)
  emoji text not null default 'package',    -- clave de la lista curada (spec 006)
  target_amount bigint not null,            -- centavos, > 0, ≤ MAX_SAFE_INTEGER
  target_currency public.currency not null, -- en qué está el objetivo: US$ 800
  saving_currency public.currency not null, -- en qué se ahorra: pesos
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id, saving_currency)     -- destino de la clave compuesta de los aportes
);

create table public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null,
  amount bigint not null,                   -- centavos; positivo = aporte, negativo = retiro; nunca 0
  currency public.currency not null,        -- siempre la moneda de ahorro de la meta
  occurred_on date not null,
  created_at timestamptz not null default now(),
  foreign key (goal_id, user_id, currency)
    references public.savings_goals (id, user_id, saving_currency) on delete cascade
);
-- RLS por user_id = auth.uid() en las dos tablas. Solo se pueden cambiar nombre, emoji,
-- objetivo y archivado de una meta; un aporte se edita (monto y fecha) o se borra.
```

En `packages/core`:

```ts
type SavingsGoal = { id; name; emoji; target: Money; savingCurrency: Currency; archived: boolean }
type Contribution = { id; goalId; amount: Money; occurredOn: IsoDate }

/** Pesos por dólar en centavos (1 US$ = $ 1.450,00 → 145000), con su momento. */
type ExchangeRate = { from: 'USD'; to: 'ARS'; rate: number; at: string; source: 'MEP' }

function convertMoney(money: Money, to: Currency, rate: ExchangeRate): Money // entero, redondeado
function goalProgress(goal, contributions, rate: ExchangeRate | null): GoalProgress
// GoalProgress: saved (en la moneda de ahorro), target (convertido si hace falta, o null sin
// cotización), remaining, ratio, y el objetivo original para mostrar "US$ 800"
function savedThisMonth(contributions, month): Record<Currency, Money> // aportes − retiros
function savedByCurrency(contributions): Record<Currency, Money> // el total de Guardado
function parseGoalForm(values): GoalFormResult // nombre de 1 a 40, objetivo > 0
function parseContributionForm(values, { goal, saved, kind }): ContributionFormResult // retiro ≤ ahorrado
function decimalToCents(value: string): number // "1542.9" → 154290; "82527.61000000" → 8252761; redondea al centavo con aritmética de enteros
```

## Comportamiento

### Ahorros

- Arriba, **Guardado en pesos** y **Guardado en dólares** (solo las monedas que tienen metas): la suma de lo ahorrado en cada una. Nunca se suman pesos y dólares.
- **Metas**, cada una en una fila con su emoji en forma de galleta, nombre, "$ 450.000 de $ 1.160.000", barra, porcentaje y "Te faltan $ 710.000 (US$ 490)", y el botón **Aportar**. Un menú ⋮ ofrece Retirar, Editar, Ver aportes, Archivar y Eliminar.
- Si el objetivo está en otra moneda, la fila aclara "Meta: US$ 800 al dólar MEP de hoy, $ 1.450" y abajo "Dólar MEP actualizado hoy a las 11:20".
- Meta cumplida (100 % o más): la barra se llena, el texto dice "¡Lo lograste!" y el emoji hace un "pop" la primera vez que se ve.
- Metas archivadas en una sección plegable, como en Categorías.

### Aportar y retirar

- Diálogo con el monto en la moneda de ahorro, la fecha (hoy por defecto) y, si el objetivo está en otra moneda, la equivalencia "≈ US$ 55 al dólar MEP de hoy".
- Una barra muestra cómo queda la meta con ese aporte (39 % → 46 %).
- Aclara: "Sale de lo disponible de octubre, pero no cuenta como gasto."
- Retirar no puede dejar la meta en negativo: "No podés retirar más de lo que tenés ahorrado ($ 450.000,00)."

### Cotización del dólar MEP

- Se pide a DolarApi (`GET https://dolarapi.com/v1/dolares/bolsa`), pública, sin claves; se usa el valor de **venta**. La respuesta (`{ casa: "bolsa", compra: 1535.9, venta: 1542.9, fechaActualizacion }`) se valida con Zod; `venta` llega como número y se pasa a texto antes de convertirla a centavos con `decimalToCents`, sin operar con punto flotante. Se muestra la hora de `fechaActualizacion`.
- Se considera fresca por 30 minutos. La última cotización buena se guarda en el navegador con su fecha y se usa si el servicio no responde ("Dólar MEP de ayer a las 18:00").
- Sin ninguna cotización: la meta muestra lo ahorrado y "No pudimos traer el dólar MEP" en lugar del porcentaje.
- La cotización no se guarda en la base: cada vez se calcula con la de hoy (la meta es "US$ 800 o lo equivalente hoy").

### Inicio, Balance y el chanchito

- En **Balance**, debajo de Resultado: **Ahorraste** (aportes − retiros del mes en esa moneda), **Invertiste** (compras de la spec 010, cuando exista) y **Te queda** (resultado − ahorraste − invertiste).
- En **Inicio**, si hubo aportes en el mes, un chip "Ahorraste $ 80.000" junto a Ingresos y Gastos.
- El mensaje "Vas bien" del chanchito (spec 008) usa lo que queda: "¡Vas bárbaro! Ahorraste $ 80.000 y te sobran $ 332.300."
- Los aportes no cambian los presupuestos ni los gastos.

### Navegación

- **Escritorio:** "Ahorros" entre Presupuestos y Categorías, con el ícono `savings`; Presupuestos pasa al ícono `donut_large`.
- **Celular:** la barra inferior queda en Inicio, Movimientos, Balance, Ahorros y **Más**. "Más" abre una hoja con Presupuestos y Categorías.

## Criterios de aceptación

- [ ] **core:** `convertMoney` convierte en los dos sentidos con enteros, redondeando al centavo, y no convierte si la moneda es la misma
- [ ] **core:** `decimalToCents` convierte "1450", "1542.9", "1450.55" y "82527.61000000" a centavos, redondea desde el tercer decimal y rechaza valores vacíos, negativos o mal formados
- [ ] **core:** `goalProgress` calcula lo ahorrado, el objetivo convertido, lo que falta y el porcentaje; sin cotización, el objetivo convertido es nulo
- [ ] **core:** `savedThisMonth` suma aportes y resta retiros del mes, por moneda
- [ ] **Base:** RLS en las dos tablas; un aporte no puede ir a una meta de otro usuario ni en otra moneda que la de ahorro; monto 0 rechazado; borrar una meta borra sus aportes
- [ ] Crear, editar, archivar y eliminar una meta; nombre duplicado rechazado con su mensaje
- [ ] Aportar y retirar actualizan el progreso; un retiro mayor a lo ahorrado se rechaza con su mensaje
- [ ] Con objetivo en dólares y ahorro en pesos, el progreso usa el dólar MEP y muestra su hora
- [ ] Si DolarApi falla, se usa la última cotización guardada con su fecha; sin ninguna, se muestra el aviso
- [ ] Balance muestra Ahorraste y Te queda; Inicio, el chip de lo ahorrado en el mes
- [ ] En celular, "Más" lleva a Presupuestos y Categorías

## Casos borde

- Meta en pesos con objetivo en pesos: sin cotización ni aclaración
- Objetivo alcanzado y después un retiro: vuelve a mostrar lo que falta
- Aporte con fecha en otro mes: cuenta para ese mes en Balance e Inicio
- Cotización con un formato inesperado: se ignora y se usa la guardada
- Archivar una meta con plata ahorrada: sigue sumando en el total de Guardado

## Tareas

- [x] Spec 009
- [x] `core`: tipos y esquemas de metas y aportes, `convertMoney`, `goalProgress`, `savedThisMonth`, `decimalToCents`, con tests primero
- [x] Migración: tablas, restricciones y RLS; tests de base
- [x] `web`: capa de datos de metas y aportes, con sus tests contra Supabase local y su fake
- [ ] `web`: cotización del dólar MEP (DolarApi), con la última guardada
- [ ] `web`: navegación con Ahorros y "Más" en celular
- [ ] `web`: pantalla Ahorros y diálogos de meta, aportar y retirar
- [ ] `web`: Ahorraste en Balance e Inicio, y el mensaje del chanchito
- [ ] Aplicar la migración en la nube, PR a `develop`

## Decisiones y notas

- Los aportes van en su propia tabla y no como movimientos: un movimiento siempre tiene categoría de ingreso o gasto, y ahorrar no es ninguna de las dos.
- La cotización no se guarda: la meta es "US$ 800 o lo equivalente hoy", así que siempre se compara con la de hoy.
- Dólar MEP porque es la referencia habitual para precios en pesos de productos importados y se puede comprar legalmente.
- DolarApi y no otra fuente: es pública, gratuita y no pide claves. Es la primera dependencia externa además de Supabase, por eso la app sigue funcionando sin ella (última cotización guardada).
- Que un retiro no deje la meta en negativo lo controla la app (`parseContributionForm`), no la base: hacerlo en Postgres pide un trigger que sume los aportes en cada escritura, y con una sola persona usando la app no hay escrituras simultáneas que lo justifiquen.
