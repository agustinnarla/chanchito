# 007 — Animaciones

**Estado:** en curso

## Objetivo

Que la app se sienta más viva y clara al usarla: que se vea qué cambió (un mes, una moneda, un tema), que las listas y las barras aparezcan con orden y que los controles respondan al tocarlos. Sin volverla lenta ni molesta, y respetando a quien pide menos movimiento.

## Alcance

- Entrada de cada pantalla al cambiar de sección
- Aparición escalonada de listas y mosaicos
- Barras de Balance y Presupuestos que crecen hasta su valor
- Montos principales que cuentan hasta su valor (Inicio y Balance)
- Microinteracciones: botones, mosaicos, emoji elegido, navegación, menú lateral, diálogos y menús
- Cambio de tema con un revelado circular desde el botón

### Fuera de alcance

- Animaciones al agregar, editar o eliminar un elemento de una lista (solo se anima al cargarla o al cambiar de mes o de moneda)
- Gestos (deslizar para eliminar, arrastrar)
- Animaciones en `apps/mobile`
- Cambios de comportamiento, de datos o de reglas de dominio

## Comportamiento

### Herramientas

- **GSAP** (con `@gsap/react` y `useGSAP`) para las animaciones con orquestación o valores: entrada de pantalla, listas, barras, montos y el "pop" del emoji elegido.
- **Tailwind** (transiciones y `tw-animate-css`) para los estados simples: hover y presión de botones y mosaicos, indicador de la navegación, menú lateral, diálogos y menús.
- **View Transitions API** para el cambio de tema: GSAP no puede animar sus pseudo-elementos.

### Movimiento

- Curvas de Material 3 (tokens `ease-emphasized`, `ease-standard` y `ease-exit` en `index.css`): enfatizada desacelerada para entradas (`cubic-bezier(0.05, 0.7, 0.1, 1)`), estándar para cambios de estado (`cubic-bezier(0.2, 0, 0, 1)`) y acelerada para salidas. En GSAP se usan sus equivalentes cercanos (`expo.out`, `power2.inOut`).
- Duraciones cortas: 150–200 ms para microinteracciones, 300–450 ms para entradas, hasta 700 ms para montos y barras.
- Solo se animan opacidad y transformaciones, salvo el ancho de las barras.

### Animaciones

- **Pantalla:** al cambiar de sección, el contenido entra con un fundido y un desplazamiento de 8 px hacia arriba. Cambiar de mes o de filtros no la vuelve a animar.
- **Listas:** los movimientos (Inicio y Movimientos), los mosaicos de Categorías, las filas de Balance y los presupuestos aparecen en cascada al cargarse y al cambiar de mes o de moneda. El escalonado se corta a los 8 primeros: el resto aparece junto con el octavo.
- **Barras:** crecen desde 0 al aparecer, también al cambiar de mes o de moneda (la lista se vuelve a armar en cascada). Si el valor de una barra cambia sin rearmar la lista (por ejemplo, al editar un movimiento), va del ancho que se ve al nuevo.
- **Montos:** el resultado del mes, los ingresos y los gastos de Inicio y los tres bloques de Balance cuentan desde 0 al aparecer, del valor que se ve al nuevo al cambiar de mes, y de nuevo desde 0 al cambiar de moneda (contar de pesos a dólares mostraría montos que no existen). Los valores intermedios son centavos enteros con el mismo formato.
- **Microinteracciones:**
  - Botones y mosaicos se achican levemente al presionarlos; los mosaicos crecen un poco al pasar el mouse.
  - El emoji de la categoría o del ícono elegido hace un "pop" al seleccionarlo.
  - La píldora de la sección activa en la barra inferior se expande desde el centro.
  - El menú lateral se minimiza y se abre con una transición de ancho, y los nombres aparecen con un fundido.
  - Diálogos y menús abren con fundido, escala y un leve desplazamiento, con curvas de Material 3.
- **Tema:** el tema nuevo se revela en un círculo que crece desde el botón hasta cubrir la pantalla. Sin View Transitions (navegadores viejos), cambia directo.

### Movimiento reducido

Con `prefers-reduced-motion: reduce` no corre ninguna animación de GSAP ni el revelado del tema: todo aparece directo en su estado final. Las transiciones CSS ya quedan anuladas por la regla global de `index.css`.

## Criterios de aceptación

- [ ] Con movimiento reducido (y en los tests, sin `matchMedia`), cada pantalla, lista, barra y monto muestra su valor final de entrada
- [ ] Un monto animado termina exactamente en el valor final y todos sus valores intermedios son centavos enteros de la misma moneda
- [ ] Una barra animada termina en su ancho final; los `progressbar` informan el valor final desde el principio
- [ ] El escalonado de una lista nunca demora más que el del octavo elemento
- [ ] Cambiar de sección anima la pantalla; cambiar de mes no
- [ ] Al alternar el tema con View Transitions disponible, el cambio ocurre dentro de la transición; sin ella, cambia directo; en ambos casos se recuerda
- [ ] El texto accesible no cambia: los tests existentes pasan sin cambios
- [ ] El bundle de la app crece menos de 40 kB comprimido

## Casos borde

- Cambiar de mes rápido varias veces: cada monto arranca del valor que se ve en ese momento, sin saltos
- Lista que se recarga por una mutación (crear o borrar): no se vuelve a escalonar
- Monto negativo o que cambia de signo: cuenta pasando por cero con el signo correcto, nunca "-$ 0"
- Cambio de tema por el sistema (no por el botón): cambia directo, sin revelado
- Pestaña en segundo plano: GSAP pausa y la animación termina al volver

## Tareas

- [x] Spec 007
- [x] `web`: GSAP, ayudantes de movimiento (curvas, movimiento reducido) y sus tests
- [x] `web`: entrada de pantalla y listas escalonadas
- [x] `web`: barras y montos animados
- [x] `web`: microinteracciones (botones, mosaicos, emoji, navegación, menú, diálogos)
- [x] `web`: revelado circular al cambiar el tema
- [ ] Repaso con movimiento reducido, PR a `develop`

## Decisiones y notas

- GSAP en lugar de solo CSS, por elección: da control fino para orquestar listas, contar montos y animar barras entre valores. Suma unos 25 kB comprimidos y no se reutiliza en Expo; la lógica de dominio sigue en `core` sin cambios.
- Los estados simples (hover, presión, diálogos) siguen con Tailwind: con GSAP serían más código para el mismo resultado.
- Las animaciones de GSAP solo corren si `prefers-reduced-motion: no-preference` coincide. Sin `matchMedia` (jsdom) no corren, así los tests ven siempre el estado final.
- Los montos se interpolan en la UI redondeando a centavos enteros: es presentación, no cálculo de dominio.
- La rama sale de `feature/006-rediseno` porque el PR #12 sigue abierto; el PR de esta spec se abre después de mergearlo.
- El revelado del tema anima el pseudo-elemento `::view-transition-new(root)` con la Web Animations API: GSAP no llega a esos pseudo-elementos.
- Las listas se vuelven a escalonar remontándolas con una `key` (mes, moneda) en lugar de observar sus datos: así una mutación que recarga la lista no la vuelve a animar.
