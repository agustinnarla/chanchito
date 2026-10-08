# 003 — Movimientos (ingresos y gastos)

**Estado:** aprobada

## Objetivo

Registrar lo que entra y lo que sale, en pesos o en dólares, para después calcular el balance mensual (spec 004) y controlar presupuestos (spec 005). Al terminar, puedo cargar un movimiento desde cualquier pantalla, ver los movimientos de cada mes, filtrarlos, editarlos y eliminarlos.

## Alcance

- Tabla `movements` en Supabase con RLS
- Cargar un movimiento desde un botón global **Nuevo movimiento**, en un diálogo
- Pantalla `/movimientos`: un mes a la vez, con navegación entre meses y filtros por tipo, categoría y moneda
- Editar y eliminar movimientos
- Archivar categorías: eliminar una categoría con movimientos la archiva (regla definida en la spec 002), y se puede restaurar
- En `packages/core`: esquemas de movimiento, utilidades de fechas y meses, filtros y orden

### Fuera de alcance

- Totales y balance del mes (spec 004)
- Transferencias entre monedas o cuentas (ver ADR 0002)
- Movimientos recurrentes, cuotas, adjuntos, importar o exportar
- Búsqueda por texto
- Dividir un movimiento en varias categorías

## Modelo de datos

```sql
create type public.currency as enum ('ARS', 'USD');

-- categories: archivado y clave para la FK compuesta
alter table public.categories add column archived_at timestamptz;
alter table public.categories add constraint categories_id_user_id_key unique (id, user_id);
grant update (archived_at) on table public.categories to authenticated;

create table public.movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  amount bigint not null,              -- centavos, siempre positivo
  currency public.currency not null,
  occurred_on date not null,
  description text,                    -- opcional
  created_at timestamptz not null default now(),

  -- La categoría tiene que ser del mismo usuario; no se puede borrar si tiene movimientos
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete restrict,
  constraint movements_amount_positive check (amount > 0),
  constraint movements_amount_safe check (amount <= 9007199254740991),  -- Number.MAX_SAFE_INTEGER
  constraint movements_description_normalized check (
    description is null
    or (description = regexp_replace(btrim(description), '\s+', ' ', 'g')
        and char_length(description) between 1 and 100)
  )
);

create index movements_user_occurred_on_idx on public.movements (user_id, occurred_on desc);
-- RLS con user_id = auth.uid() y permisos por columna:
-- insert/update de (category_id, amount, currency, occurred_on, description); user_id inmutable
```

- El **tipo** (ingreso o gasto) de un movimiento es el de su categoría; no se guarda aparte.
- El monto se guarda siempre positivo. Al mostrarlo, los gastos llevan signo negativo.

En `packages/core`:

```ts
type IsoDate = string // 'aaaa-mm-dd'
type Month = string // 'aaaa-mm'

type Movement = {
  id: string
  amount: Money // { amount: centavos > 0, currency }
  occurredOn: IsoDate
  description: string | null
  category: { id: string; name: string; kind: CategoryKind; archived: boolean }
}
```

## Comportamiento

### Cargar un movimiento

- Botón **Nuevo movimiento** en la barra de navegación, visible desde cualquier pantalla. Abre un diálogo con:
  - **Tipo:** Gasto (por defecto) o Ingreso
  - **Monto:** se escribe como en `parseMoney` (`1.234,56`, `1234.5`); mayor a 0
  - **Moneda:** ARS (por defecto) o USD
  - **Fecha:** por defecto, hoy (fecha local); se permiten fechas pasadas y futuras
  - **Categoría:** obligatoria; solo las categorías activas del tipo elegido, en orden alfabético
  - **Descripción:** opcional, hasta 100 caracteres; se normalizan los espacios como en los nombres de categoría
- Si no hay categorías del tipo elegido, el diálogo lo dice y ofrece ir a Categorías.
- Al guardar, el diálogo se cierra, aparece un aviso "Movimiento guardado" y los listados se actualizan.
- Si hay errores, se muestran junto a cada campo, en español, sin perder lo escrito.

### Listado (`/movimientos`)

- Muestra un mes; por defecto, el actual. Flechas ← → para cambiar de mes y el nombre del mes ("Octubre 2026").
- El mes y los filtros quedan en la URL (`/movimientos?mes=2026-10&tipo=gasto&moneda=USD&categoria=<id>`), así funcionan el botón Atrás y los links.
- Orden: fecha descendente; a igual fecha, el último cargado primero.
- Cada fila muestra fecha (`dd/mm/aaaa`), categoría, descripción y monto con su moneda. Gastos con signo negativo (`-$ 1.234,56`), ingresos con signo positivo (`+US$ 100,00`).
- **Filtros:** tipo (Todos, Gastos, Ingresos), categoría (todas, incluidas las archivadas) y moneda (Todas, ARS, USD). Se combinan entre sí.
- Mes sin movimientos: "No hay movimientos en octubre 2026." Si hay movimientos pero los filtros no dejan ninguno, lo dice y ofrece limpiar los filtros.

### Editar y eliminar

- Cada fila tiene **Editar** (abre el mismo diálogo con los datos cargados) y **Eliminar** (pide confirmación).
- Al editar se puede cambiar cualquier campo, incluso pasar a una categoría del otro tipo.
- Si la categoría del movimiento está archivada, el diálogo la sigue mostrando como "(archivada)" para no perderla.

### Archivar categorías

- Eliminar una categoría **sin** movimientos la borra (como hoy).
- Eliminar una categoría **con** movimientos la archiva y avisa: "«Supermercado» tiene movimientos, así que se archivó."
- Las archivadas no se ofrecen al cargar movimientos. En Categorías aparecen en una sección **Archivadas** con **Restaurar**.
- El nombre de una archivada sigue ocupado: crear otra igual da error y sugiere restaurarla.

## Criterios de aceptación

- [ ] Desde cualquier pantalla, "Nuevo movimiento" abre el diálogo con Gasto, ARS y la fecha de hoy preseleccionados
- [ ] Cargar un gasto de `1.234,56` ARS en "Supermercado" lo muestra en el mes de su fecha como `-$ 1.234,56`
- [ ] Cargar un ingreso de `100` USD lo muestra como `+US$ 100,00`
- [ ] Un monto vacío, `0`, negativo o con más de 2 decimales muestra el error de `parseMoney` y no se guarda
- [ ] Sin categoría elegida, no se guarda y lo indica
- [ ] Al cambiar el tipo, la lista de categorías muestra solo las de ese tipo, sin archivadas
- [ ] Una descripción de más de 100 caracteres da error; una de solo espacios se guarda vacía
- [ ] `/movimientos` muestra el mes actual; ← y → cambian de mes y actualizan la URL
- [ ] El listado está ordenado por fecha descendente
- [ ] Los filtros por tipo, categoría y moneda se combinan y quedan en la URL
- [ ] Editar un movimiento actualiza el listado; si cambia la fecha a otro mes, desaparece del mes actual
- [ ] Eliminar pide confirmación y quita el movimiento
- [ ] Eliminar una categoría con movimientos la archiva y avisa; sus movimientos la siguen mostrando
- [ ] Restaurar una categoría archivada la vuelve a ofrecer al cargar movimientos
- [ ] **RLS:** un usuario no puede ver, crear, modificar ni eliminar movimientos de otro
- [ ] **RLS:** un usuario no puede asociar un movimiento a una categoría de otro usuario
- [ ] **Base:** rechaza montos ≤ 0 o mayores a `Number.MAX_SAFE_INTEGER`, monedas inválidas y descripciones no normalizadas o de más de 100 caracteres
- [ ] **Base:** no se puede borrar una categoría con movimientos
- [ ] La migración está aplicada en el proyecto en la nube

## Casos borde

- "Hoy" es la fecha local: a las 23:30 del 31/10 en Argentina, la fecha por defecto es 31/10 (no 01/11 por UTC)
- Movimientos del 1 y del último día del mes aparecen en ese mes y no en el vecino; febrero de año bisiesto incluye el 29
- Navegar de enero a diciembre del año anterior y viceversa
- Un `?mes=` inválido en la URL (`2026-13`, `hola`) muestra el mes actual
- Una categoría filtrada en la URL que no existe: se ignora el filtro
- Montos grandes (`1.000.000.000,00`) se guardan y se muestran sin perder precisión
- Editar un movimiento cuya categoría se archivó mientras tanto: se puede guardar sin cambiar la categoría
- Dos movimientos idénticos el mismo día son válidos (no hay unicidad)

## Tareas

- [x] Spec 003
- [x] `core`: fechas y meses (fecha local de hoy, rango de un mes, navegación, formato `dd/mm/aaaa` y nombre del mes)
- [ ] `core`: esquemas de movimiento, filtros y orden
- [ ] Migración: `currency`, archivado de categorías y tabla `movements` con RLS y permisos por columna
- [ ] Tests de base: RLS y restricciones de `movements` y archivado de categorías
- [ ] `web`: archivar y restaurar categorías (capa de datos, pantalla y tests)
- [ ] `web`: capa de datos de movimientos (con tests contra Supabase local) y fake en memoria
- [ ] `web`: diálogo de movimiento y botón global "Nuevo movimiento"
- [ ] `web`: pantalla de movimientos: mes en la URL, navegación y listado
- [ ] `web`: editar y eliminar movimientos
- [ ] `web`: filtros por tipo, categoría y moneda
- [ ] Aplicar la migración en la nube, PR a `develop`

## Decisiones y notas

- Categoría obligatoria: el tipo sale de la categoría, y el balance por categoría y los presupuestos quedan completos.
- La FK compuesta `(category_id, user_id)` impide asociar un movimiento a la categoría de otro usuario. RLS no alcanza porque Postgres no aplica RLS al verificar claves foráneas.
- `on delete restrict` en la categoría: la base impide borrar una categoría con movimientos, y la app la archiva en ese caso.
- Monto positivo y tipo derivado de la categoría: no hay forma de cargar un "gasto positivo" o un "ingreso negativo" por error.
- Fechas como strings `aaaa-mm-dd` en todo el código, sin `Date` salvo para calcular "hoy": evita corrimientos por zona horaria.
- El mes se filtra en la base (rango de fechas) y los filtros de tipo, categoría y moneda se aplican en el cliente sobre el mes, que es un volumen chico.
- Moneda como enum de Postgres (`currency`), igual que `category_kind`.
