# 006 — Rediseño visual

**Estado:** aprobada

## Objetivo

Darle a Chanchito una identidad visual propia, minimalista y cómoda de usar todos los días, en claro y en oscuro. La dirección está aprobada en el lienzo [Chanchito: direcciones visuales](https://claude.ai/artifact/CNYYPFqzfhaC26HSfSmWEa) (pantalla C3 y la tercera fila), inspirada en el estilo Material 3 de [sb Money](https://stepbro.site/apps/money/). Al terminar, todas las pantallas siguen ese diseño y cada categoría tiene su emoji 3D.

## Alcance

- Sistema de diseño en `index.css`: colores en claro y oscuro, tipografías, radios e íconos
- Tema claro y oscuro: sigue al sistema y se puede cambiar desde el menú (se recuerda)
- Menú lateral minimizable en escritorio; barra inferior con botón flotante "+" en celular
- Emoji por categoría, de una lista curada de Fluent Emoji 3D incluida en la app
- Rediseño de todas las pantallas: Inicio, Movimientos, Balance, Presupuestos, Categorías, Login y los diálogos
- Balance con barras simples (sin Recharts)

### Fuera de alcance

- Cambios de comportamiento o de reglas de dominio (lo que ya hace la app sigue igual, salvo lo que se lista acá)
- Animaciones de entrada o transiciones entre pantallas
- Elegir cualquier emoji del sistema o subir íconos propios
- Personalizar colores o elegir otros temas además de claro y oscuro

## Modelo de datos

```sql
alter table public.categories add column emoji text not null default 'package';
alter table public.categories add constraint categories_emoji_format check (emoji ~ '^[a-z0-9_]{1,40}$');
grant update (emoji) on table public.categories to authenticated;
grant insert (emoji) ...  -- junto con name y kind
-- Las categorías existentes reciben el emoji de su nombre si coincide con una sugerida (ej. Supermercado → shopping_cart)
```

En `packages/core`:

```ts
type CategoryEmoji = string // clave de la lista curada: 'shopping_cart', 'house', ...
const CATEGORY_EMOJIS: readonly { key: CategoryEmoji; label: string }[] // 50, agrupados por tema
const DEFAULT_CATEGORY_EMOJI = 'package'

type Category = { id; name; kind; archived; emoji: CategoryEmoji }
```

- La base solo controla el formato de la clave; que exista en la lista la valida `core`. Una clave desconocida (por ejemplo, de una versión futura) se muestra con el emoji por defecto.
- Cada sugerida tiene su emoji (Supermercado 🛒, Alquiler 🏠, Expensas 🏢, Servicios 💡, Transporte 🚌, Salud 💊, Salidas 🍻, Compras 🛍️, Educación 📚, Suscripciones 📺, Otros gastos 📦, Sueldo 💼, Freelance 💻, Otros ingresos 💰).

## Comportamiento

### Sistema de diseño

- **Superficies tonales**, sin sombras ni bordes: fondo, superficie baja (paneles), contenedor (bloques dentro de un panel) y contenedor alto (controles). Esquinas de 28 px en paneles, 20 px en bloques y píldora en botones y selectores.
- **Colores** (oscuro / claro):
  - Fondo `#0c160d` / `#f1fded`; paneles `#141e14` / `#e6f1e1`; texto `#dae6d6` / `#141e14`; texto secundario `#b9cbb7` / `#3b4b3b`
  - Acento (botón principal) `#00f46b` con texto `#00391a` / `#00753a` con texto blanco
  - Activo (sección, opción elegida) `#1f4a28` con texto `#c8ffd0` / `#9afda6` con texto `#00391a`
  - Ingresos en verde (`#7dff9e` / `#006e2c`); gastos en el color del texto
  - Barras de Balance: gastos naranja y ingresos azul, validados juntos para daltonismo en cada tema; estados de presupuestos con sus colores de estado (spec 005)
- **Tipografía:** DM Sans para la interfaz y Geist Mono para los montos. Se incluyen en la app (`@fontsource`), sin pedirlas a Google.
- **Íconos:** Material Symbols Rounded como SVG sueltos (solo los que se usan, generados con `pnpm --filter @chanchito/web icons`); relleno en la sección activa.
- **Emojis:** Fluent Emoji 3D (Microsoft, licencia MIT), en WebP de 96 px, servidos por la app.
- Texto con contraste de 4.5:1 como mínimo; foco visible con teclado; áreas táctiles de 44 px.

### Tema

- Por defecto sigue al sistema (`prefers-color-scheme`). El botón al pie del menú alterna claro y oscuro y la elección se guarda en el navegador.
- Sin parpadeo al cargar: el tema se aplica antes de pintar la página.

### Navegación

- **Escritorio** (≥ 768 px): menú lateral con el logo (chanchito 3D), "Nuevo movimiento", las 5 secciones con su ícono y el botón de tema. Se minimiza a solo íconos con un botón y la elección se recuerda.
- **Celular** (< 768 px): barra inferior con las 5 secciones (ícono y nombre) y un botón flotante "+" para "Nuevo movimiento". Arriba, una barra con el logo, el botón de tema y "Cerrar sesión".

### Pantallas

- **Inicio**: mes con ← →, selector ARS | USD, el resultado del mes grande y debajo ingresos y gastos en dos chips. Luego **Últimos movimientos** (los 6 más recientes del mes, de cualquier moneda) con "Ver todos". Sin tarjetas ni presupuestos.
- **Movimientos**: los filtros como píldoras (tipo segmentado, moneda y categoría como menús); la lista agrupada por día ("Sábado 11 de octubre"); cada fila con el emoji de su categoría, y Editar y Eliminar en un menú ⋮.
- **Balance**: selector ARS | USD; Ingresos, Gastos y Resultado en bloques; gastos e ingresos por categoría como filas con emoji, monto, porcentaje y barra. Las barras son proporcionales a la categoría más grande de cada lista. Se mantiene la tabla accesible (la lista es la tabla).
- **Presupuestos**: el resumen por moneda arriba ("Gastado $ X de $ Y" y lo gastado sin presupuesto), y cada presupuesto con emoji, barra, ícono y texto de estado, y menú ⋮.
- **Categorías**: grilla de mosaicos con emoji y nombre, separadas en Gastos e Ingresos; las archivadas en una sección plegable. Tocar un mosaico abre el diálogo para renombrar, cambiar el emoji, archivar o eliminar.
- **Diálogo de movimiento**: tipo segmentado arriba, el monto grande con la moneda al lado, la categoría se elige tocando su emoji en una grilla, y fecha y descripción abajo.
- **Diálogo de categoría**: nombre, tipo (solo al crear) y el emoji elegido de la lista curada, en una grilla.
- **Login**: centrado, con el chanchito 3D y el mismo estilo.

## Criterios de aceptación

- [ ] La app sigue el tema del sistema; el botón lo cambia y la elección se mantiene al recargar
- [ ] El menú lateral se minimiza a íconos y se vuelve a abrir; la elección se mantiene al recargar
- [ ] En celular aparece la barra inferior con las 5 secciones y el botón "+" abre "Nuevo movimiento"
- [ ] Inicio muestra el resultado del mes en la moneda elegida y los últimos 6 movimientos del mes
- [ ] Movimientos se agrupan por día y cada fila muestra el emoji de su categoría
- [ ] En el diálogo de movimiento la categoría se elige tocando su emoji; solo aparecen las del tipo elegido
- [ ] Crear o editar una categoría permite elegir su emoji; una nueva arranca con 📦
- [ ] Las categorías sugeridas se crean con su emoji, y las existentes con nombre de sugerida lo reciben al migrar
- [ ] Balance muestra las barras por categoría con monto y porcentaje visibles, sin Recharts
- [ ] Todas las pantallas cumplen contraste 4.5:1 en claro y en oscuro
- [ ] **Base:** rechaza claves de emoji con formato inválido; el emoji se puede cambiar, el tipo no
- [ ] Los tests existentes siguen pasando, ajustados al nuevo marcado solo donde cambió el texto o la estructura
- [ ] La migración está aplicada en el proyecto en la nube

## Casos borde

- Categoría con una clave de emoji que la app no conoce: se muestra 📦
- Nombres de categoría largos en mosaicos y en la grilla del diálogo: se cortan con "…" y el nombre completo queda en el texto accesible
- Menú minimizado en una pantalla angosta de escritorio: el contenido usa el ancho liberado
- Mes con más de 6 movimientos: Inicio muestra 6; mes sin movimientos: "No hay movimientos en octubre 2026." con un botón para cargar el primero
- Navegador con `localStorage` bloqueado: el tema sigue al sistema y el menú arranca abierto, sin errores

## Tareas

- [x] Spec 006
- [x] `core`: lista curada de emojis, emoji en el esquema de categoría y en las sugeridas
- [x] Migración: columna `emoji` con su formato, permisos y emojis de las existentes; tests de base
- [x] `web`: emojis WebP incluidos, componente `CategoryEmoji` y capa de datos de categorías con emoji
- [x] `web`: sistema de diseño (tokens claro/oscuro, fuentes, íconos) y tema con su botón
- [x] `web`: navegación (menú lateral minimizable y barra inferior en celular)
- [x] `web`: Inicio
- [x] `web`: Movimientos y diálogo de movimiento
- [ ] `web`: Balance sin Recharts
- [ ] `web`: Presupuestos
- [ ] `web`: Categorías y diálogo de categoría
- [ ] `web`: Login y repaso de accesibilidad en claro y oscuro
- [ ] Aplicar la migración en la nube, PR a `develop`

## Decisiones y notas

- Material 3 tonal en lugar de sombras y bordes: separa por color de superficie, más calmo y más fácil de mantener en dos temas.
- Sin degradados ni tarjetas tipo billetera: se probaron y se descartaron en el lienzo.
- Emojis Fluent 3D incluidos en la app, en una lista curada: se ven igual en todos los sistemas, no dependen de un servicio externo y mantienen la coherencia visual. Se guarda la clave y no el carácter, porque la imagen es lo que se muestra.
- Se saca Recharts: las barras con monto y porcentaje visibles se leen sin pasar el mouse, funcionan igual en celular y la app pesa unos 100 kB menos. Actualiza lo decidido en la spec 004.
- Verde y naranja no se distinguen con daltonismo (validado), por eso las barras de Balance siguen en naranja y azul aunque el acento sea verde.
- Fuentes incluidas con `@fontsource` y no desde Google Fonts: sin dependencias externas al cargar.
- Íconos como SVG y no como fuente: la fuente de Material Symbols pesa de 1 a 5 MB; los 26 íconos que usa la app, unos 8 kB comprimidos.
- El verde del botón principal en claro es `#00753a` y no `#00a347`: con texto blanco, `#00a347` no llegaba a 4.5:1.
- En celular, el tema y "Cerrar sesión" van en una barra superior y no en Inicio, como decía el borrador: así están en todas las pantallas.
- Se muestra un solo menú según el ancho (con `matchMedia`), en lugar de los dos ocultando uno con CSS: los lectores de pantalla y los tests ven una sola navegación.
- La lista de emojis es una sola para gastos e ingresos, agrupada por tema: separarla por tipo complicaba elegir, por ejemplo, 🏠 para un alquiler que se cobra.
