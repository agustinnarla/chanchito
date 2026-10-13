# 011 — Apariencia: login, colores y menú minimizado

**Estado:** aprobada

## Objetivo

Que la app se sienta propia: elegir el color de acento entre seis paletas (guardado en la cuenta), un login con más personalidad y más claro, y un menú minimizado que se vea bien. Diseño aprobado en el lienzo [Chanchito: direcciones visuales](https://claude.ai/artifact/CNYYPFqzfhaC26HSfSmWEa), fila "Apariencia" (F1 a F3).

## Alcance

- Seis paletas de acento: Verde (la actual), Azul, Violeta, Rosa, Naranja y Turquesa, cada una en claro y oscuro
- El color elegido se guarda en la cuenta; el tema (Sistema, Claro u Oscuro) se guarda en cada dispositivo
- Diálogo "Apariencia" con el tema y el color, que reemplaza al botón de tema
- Login en dos partes, con el chanchito y el saludo, email recordado, mostrar contraseña, aviso de Bloq Mayús y mensajes más claros
- Menú minimizado como riel de Material 3: solo íconos, con el logo arriba y sin saltos al abrir o cerrar

### Fuera de alcance

- Elegir un color libre (Material Dynamic Color)
- Cambiar los colores de los estados (va bien, ajustado, te pasaste), de ingresos y de las barras de Balance: quedan fijos porque tienen significado y están validados para daltonismo
- Recuperar la contraseña o registrarse (la app tiene un solo usuario)
- Cambiar tipografías o radios

## Modelo de datos

```sql
create table public.user_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  accent text not null default 'verde',   -- check: una de las seis paletas
  updated_at timestamptz not null default now()
);
-- RLS por user_id = auth.uid(). Se crea al elegir un color por primera vez (upsert);
-- sin fila, la app usa 'verde'.
```

En `packages/core`:

```ts
const ACCENTS = ['verde', 'azul', 'violeta', 'rosa', 'naranja', 'turquesa'] as const
type Accent = (typeof ACCENTS)[number]
const DEFAULT_ACCENT: Accent = 'verde'
const ACCENT_LABELS: Record<Accent, string> // "Verde", "Azul"…
function resolveAccent(value: unknown): Accent // un valor desconocido (por ejemplo, de una versión futura) da 'verde'
type ThemePreference = 'system' | 'light' | 'dark'
```

Los valores de cada paleta (fondos, superficies, texto, acento, activo) viven en `index.css` de `web`, porque son de presentación.

## Comportamiento

### Paletas

- Cada paleta define en claro y en oscuro: fondo, superficies (baja, contenedor, alta), texto, texto secundario, acento y su texto, y el color "activo" (sección y opción elegidas) con su texto. Las superficies llevan un leve tinte del color, como en Material 3.
- Verde mantiene exactamente los valores de la spec 006.
- Fijos en todas las paletas: ingresos, estados (spec 008), barras de Balance, error y avisos.
- Todo el texto cumple 4.5:1 sobre sus fondos en las seis paletas, en claro y en oscuro (verificado al generarlas).

### Apariencia

- En escritorio, el botón "Apariencia" al pie del menú (en el riel, solo el ícono) abre el diálogo. En celular, desde "Más" y desde el botón de la barra superior que hoy cambia el tema.
- **Tema:** Sistema, Claro u Oscuro, en un selector segmentado. Por defecto, Sistema. Se guarda en el navegador.
- **Color:** las seis paletas como muestras con forma de galleta; la elegida se transforma en flor con una tilde. Al tocarla, toda la app cambia en el momento, con una transición suave de colores.
- El color se guarda en la cuenta. Además se recuerda en el navegador para aplicarlo antes de pintar la página (sin parpadeo) y en el login, donde todavía no hay sesión.
- Si no se puede guardar en la cuenta: se mantiene en el navegador y avisa "No se pudo guardar el color en tu cuenta."

### Login

- **Escritorio (≥ 1024 px):** dos partes. A la izquierda, un panel con un degradé del color elegido, el chanchito grande sobre su forma de sol con el emoji del momento del día, el saludo ("Buenas noches", spec 008) y "Tus pesos y tus dólares, en orden.", y chips con lo que hace la app. A la derecha, el formulario.
- **Celular:** el panel arriba, más compacto, y el formulario debajo.
- **Email recordado:** después de ingresar, el email se guarda en el navegador. La próxima vez viene completo con el chip "Recordado" y el enlace "¿No sos vos? Usar otro email", que lo borra.
- **Mostrar contraseña:** botón con ícono de ojo, "Mostrar contraseña" / "Ocultar contraseña".
- **Bloq Mayús:** si está activado mientras se escribe la contraseña, se avisa debajo del campo.
- **Mensajes:**
  - Credenciales incorrectas: "El email o la contraseña no coinciden. Revisalos y probá de nuevo." en un aviso con ícono, y el campo de contraseña marcado.
  - Sin conexión: "No pudimos conectarnos. Revisá tu conexión y probá de nuevo."
  - Otro error: "No pudimos iniciar sesión. Probá de nuevo en un momento."
- **Ingresando:** el botón muestra un indicador girando y "Ingresando…", y el formulario no se puede reenviar.

### Menú minimizado (riel)

- 96 px de ancho. De arriba abajo: el logo (vuelve a Inicio), el botón para abrir el menú, "Nuevo movimiento" como botón con forma de galleta, las secciones y, al pie, "Apariencia" y "Cerrar sesión".
- Cada sección es solo el ícono dentro de una píldora de 56 × 32 px (Material 3); la activa lleva el color activo y el ícono relleno. Sin nombres visibles: el nombre está como texto accesible y como tooltip.
- Abrir y cerrar anima el ancho; los nombres aparecen y desaparecen con un fundido, sin que los íconos salten de lugar.

## Criterios de aceptación

- [ ] **core:** `resolveAccent` devuelve la paleta para cada clave válida y 'verde' para cualquier otra cosa
- [ ] **Base:** RLS en `user_preferences`; solo se aceptan las seis claves; otro usuario no ve ni cambia las preferencias
- [ ] Elegir un color cambia la app en el momento, lo guarda en la cuenta y en el navegador; al recargar se aplica antes de pintar
- [ ] Si guardar en la cuenta falla, el color queda en el navegador y se avisa
- [ ] El tema Sistema sigue al sistema; Claro y Oscuro lo fijan; la elección queda en el navegador
- [ ] Las seis paletas cumplen 4.5:1 en claro y en oscuro; los colores de estados e ingresos no cambian
- [ ] El login recuerda el email, permite mostrar la contraseña, avisa de Bloq Mayús y muestra los nuevos mensajes de error
- [ ] El riel muestra solo íconos con su nombre accesible y tooltip, la sección activa en su píldora, y "Apariencia" y "Cerrar sesión" al pie
- [ ] Los tests existentes siguen pasando, ajustados solo donde cambió el marcado (botón de tema → "Apariencia")

## Casos borde

- Primera vez sin color guardado: verde
- Color guardado en la cuenta distinto del del navegador (por ejemplo, cambiado en otro dispositivo): gana el de la cuenta al iniciar sesión
- Navegador con `localStorage` bloqueado: el tema sigue al sistema, el color viene de la cuenta y el email no se recuerda, sin errores
- Clave de color desconocida en la cuenta: verde
- Con movimiento reducido: los colores cambian sin transición y el riel abre sin animación

## Tareas

- [x] Spec 011
- [ ] `core`: paletas (claves, etiquetas, `resolveAccent`) y preferencia de tema, con tests primero
- [ ] Migración: `user_preferences` con su restricción y RLS; tests de base
- [ ] `web`: paletas en `index.css` y aplicación sin parpadeo (script inicial)
- [ ] `web`: preferencias en la cuenta (capa de datos, fake y tests) y tema Sistema/Claro/Oscuro
- [ ] `web`: diálogo "Apariencia" en escritorio y celular
- [ ] `web`: menú minimizado como riel
- [ ] `web`: login renovado
- [ ] Aplicar la migración en la nube, PR a `develop`

## Decisiones y notas

- Paletas predefinidas y no color libre: cada una armada y validada a mano para claro y oscuro, sin sumar una librería de color dinámico.
- El color va en la cuenta (se ve igual en todos los dispositivos y en la futura app mobile) y el tema en cada dispositivo (por ejemplo, oscuro en el celular a la noche y claro en la compu).
- Los colores con significado (estados, ingresos, barras) no cambian con la paleta: cambiarlos rompería la validación de daltonismo de las specs 006 y 008.
- Riel sin nombres: más limpio; el nombre queda para lectores de pantalla y como tooltip.
- Las paletas se generaron en OKLCH a partir del tono de cada color (misma luminosidad y saturación para todas) y se verificó el contraste de cada combinación de texto y fondo.
