# 002 — Categorías

**Estado:** aprobada

## Objetivo

Poder organizar los movimientos (spec 003) y los presupuestos (spec 005) por categoría. Al terminar, puedo crear, renombrar y eliminar mis categorías de ingresos y de gastos, o arrancar con un set sugerido. Es la primera tabla propia, así que también deja armada la base de datos versionada y los tests de RLS.

## Alcance

- Tabla `categories` en Supabase con RLS por `user_id = auth.uid()`
- Supabase CLI con migraciones versionadas en el repo y Supabase local (Docker) para desarrollo y tests
- Tests de RLS con Vitest contra Supabase local, en la máquina y en CI
- Tipos de TypeScript generados desde la base, con chequeo en CI de que estén al día
- En `packages/core`: esquemas Zod de categoría, normalización del nombre, orden alfabético y el set de categorías sugeridas
- Pantalla `/categorias`: listado separado en Gastos e Ingresos, crear, renombrar y eliminar
- Botón "Crear categorías sugeridas" cuando no tengo ninguna

### Fuera de alcance

- Subcategorías
- Color o ícono por categoría
- Archivar categorías: la regla se define acá, pero se implementa en la spec 003 (ver "Eliminar")
- Cambiar el tipo (ingreso/gasto) de una categoría existente
- Reordenar a mano

## Modelo de datos

Migración `supabase/migrations/<timestamp>_create_categories.sql`:

```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  created_at timestamptz not null default now(),
  constraint categories_name_trimmed check (name = btrim(name)),
  constraint categories_name_length check (char_length(name) between 1 and 50)
);

-- Nombre único por usuario y tipo, sin distinguir mayúsculas
create unique index categories_user_kind_name_key
  on public.categories (user_id, kind, lower(name));

alter table public.categories enable row level security;
-- Políticas select/insert/update/delete con user_id = auth.uid(), solo para el rol authenticated
```

- `kind` no se puede modificar después de crear la categoría (lo garantiza un trigger, no solo la UI).
- `user_id` tampoco se puede modificar.

En `packages/core`:

```ts
type CategoryKind = 'income' | 'expense'

type Category = {
  id: string
  name: string
  kind: CategoryKind
}
```

## Comportamiento

### Nombre

- Se recortan los espacios al principio y al final, y los espacios internos repetidos se reducen a uno.
- Entre 1 y 50 caracteres, después de normalizar.
- No puede haber dos categorías del mismo tipo con el mismo nombre, sin distinguir mayúsculas ("Comida" y "comida" chocan). Sí puede haber "Otros" de gasto y "Otros" de ingreso.

### Listado (`/categorias`)

- Dos secciones: **Gastos** e **Ingresos**, cada una en orden alfabético (español, sin distinguir mayúsculas ni tildes al ordenar).
- Si una sección está vacía, lo dice.

### Crear

- Formulario con nombre y tipo (Gasto / Ingreso; por defecto Gasto).
- Errores en español: nombre vacío, demasiado largo o repetido ("Ya existe una categoría de gasto con ese nombre.").

### Renombrar

- Se edita el nombre en el lugar. Mismas validaciones que al crear.
- El tipo no se puede cambiar.

### Eliminar

- Pide confirmación.
- En esta spec no existen movimientos, así que eliminar borra la categoría.
- **Regla para la spec 003:** si la categoría tiene movimientos, eliminar la archiva en vez de borrarla. Una categoría archivada no aparece en los selectores, los movimientos viejos la conservan y se puede restaurar.

### Categorías sugeridas

- Si no tengo ninguna categoría, la pantalla muestra el botón **Crear categorías sugeridas**. Nada se crea solo.
- Crea:
  - **Gastos:** Supermercado, Alquiler, Expensas, Servicios, Transporte, Salud, Salidas, Compras, Educación, Suscripciones, Otros gastos
  - **Ingresos:** Sueldo, Freelance, Otros ingresos
- Si se aprieta dos veces, no se duplican.
- Después se editan o eliminan como cualquier otra.

## Criterios de aceptación

- [ ] Sin categorías, veo el botón "Crear categorías sugeridas"; al usarlo aparecen las 14 sugeridas en sus secciones
- [ ] Crear "Comida" de gasto la muestra en Gastos, en orden alfabético
- [ ] Crear "comida" de gasto teniendo "Comida" de gasto muestra "Ya existe una categoría de gasto con ese nombre."
- [ ] Crear "Otros" de ingreso teniendo "Otros" de gasto funciona
- [ ] El nombre " Café con leche " se guarda como "Café con leche"
- [ ] Un nombre vacío o de más de 50 caracteres muestra un error y no se guarda
- [ ] Renombrar una categoría actualiza el listado; renombrarla a un nombre repetido muestra el error
- [ ] Eliminar pide confirmación y, al confirmar, la categoría desaparece
- [ ] **RLS:** un usuario no puede ver, crear, modificar ni eliminar categorías de otro usuario
- [ ] **RLS:** sin sesión no se puede leer ni escribir la tabla
- [ ] **Base:** no se puede cambiar el `kind` ni el `user_id` de una categoría existente
- [ ] **Base:** la base rechaza nombres con espacios en los extremos, vacíos o de más de 50 caracteres
- [ ] Los tests de RLS corren en CI contra Supabase local
- [ ] El CI falla si los tipos generados no coinciden con las migraciones
- [ ] La migración está aplicada en el proyecto de Supabase en la nube

## Casos borde

- Nombres con tildes o eñes ("Educación", "Niñera"): se guardan tal cual y se ordenan bien
- "Educacion" y "Educación": son nombres distintos (la unicidad solo ignora mayúsculas, no tildes)
- Dos pestañas abiertas creando la misma categoría: la base rechaza la segunda con el error de nombre repetido
- Crear sugeridas teniendo ya alguna categoría: el botón no aparece; si igual se llama, solo crea las que falten
- Sin conexión o error inesperado: mensaje genérico en español, sin perder lo escrito en el formulario

## Tareas

- [x] Spec 002
- [x] Supabase CLI como paquete del workspace (`supabase/`), `config.toml`, scripts y Supabase local
- [ ] `core`: esquemas, normalización, orden y categorías sugeridas (tests primero)
- [ ] Migración `categories` con RLS, índice único y trigger de inmutabilidad
- [ ] Tests de RLS y de restricciones con Vitest contra Supabase local
- [ ] CI: job `db` (Supabase local, tests de RLS, chequeo de tipos) y check requerido
- [ ] `web`: tipos generados, cliente tipado y capa de datos de categorías (TanStack Query)
- [ ] `web`: pantalla de categorías: listado y crear
- [ ] `web`: renombrar y eliminar
- [ ] `web`: crear categorías sugeridas
- [ ] Aplicar la migración en el proyecto en la nube, PR a `develop`

## Decisiones y notas

- Categorías separadas por tipo: al cargar un gasto solo se ofrecen categorías de gasto, y los presupuestos (spec 005) solo aplican a gastos.
- Archivar en vez de borrar cuando hay movimientos: se preserva el historial. Se implementa en la 003, porque recién ahí existen movimientos.
- Sugeridas por botón y no automáticas: no se crean datos sin pedirlo.
- Las sugeridas viven en `packages/core` para reutilizarlas en mobile.
- Supabase local con Docker, también en la máquina de desarrollo: los tests de RLS corren igual en local y en CI. En la nube solo se aplican migraciones ya probadas.
- `kind` en inglés en la base (`income`/`expense`); en la UI se muestra "Ingreso"/"Gasto".
