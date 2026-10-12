# 008 — Más vida: color con significado, formas y personaje

**Estado:** hecha

## Objetivo

Que la interfaz reaccione a los números del mes sin perder el estilo minimalista: que se note de un vistazo si el mes va bien, ajustado o pasado, con un chanchito que acompaña y formas de Material 3 Expressive que le dan identidad. La dirección está en el lienzo [Chanchito: direcciones visuales](https://claude.ai/artifact/CNYYPFqzfhaC26HSfSmWEa), fila "Más vida" (D1 a D4), con los colores de la mezcla elegida en D4.

## Alcance

- Estado del mes (va bien, ajustado, te pasaste, vacío), calculado en `core`
- Chanchito con ánimo y mensaje en Inicio, y saludo según la hora
- Color según el estado: degradé sutil en el panel del mes y tinte suave en los presupuestos
- Formas expresivas (galleta, trébol, cuadrado suave, pentágono, sol, flor) en los emojis de categoría y en el botón "+"
- Pantallas vacías amables (Inicio sin movimientos)

### Fuera de alcance

- Frases con comparaciones entre meses ("gastaste 12 % menos que en septiembre") y gráfico de gasto por día: idea 4, para una spec aparte
- Celebraciones (idea 5)
- Elegir la forma de cada categoría: se asigna sola
- Cambios en la base de datos

## Modelo de datos

Sin cambios en la base. En `packages/core`:

```ts
type MonthMood =
  | { kind: 'empty' } // el mes no tiene movimientos
  | { kind: 'quiet' } // hay movimientos, pero ninguno en esta moneda
  | { kind: 'good'; net: Money }
  | { kind: 'warning'; budget: BudgetProgress } // el presupuesto más cerca del límite
  | { kind: 'exceeded'; budget: BudgetProgress } // el que más se pasó
  | { kind: 'negative'; net: Money } // salió más de lo que entró, sin presupuesto pasado

function monthMood(input: {
  hasMovements: boolean // en cualquier moneda
  summary: CurrencySummary // de la moneda elegida
  budgets: readonly BudgetProgress[] // de la moneda elegida
}): MonthMood
function moodMessage(mood: MonthMood, context: { month: Month; today: IsoDate }): string
function formatWholeMoney(money: Money): string // "$ 412.300", redondeado al peso
function formatMonthName(month: Month): string // "octubre"
type DayPart = 'morning' | 'afternoon' | 'night'
function dayPart(date: Date): DayPart // 5 a 11:59 mañana, 12 a 19:59 tarde, el resto noche
function greeting(part: DayPart): string // "Buen día", "Buenas tardes", "Buenas noches"
```

## Comportamiento

### Estado del mes

Se calcula para el mes y la moneda elegidos en Inicio, en este orden:

1. **Vacío:** el mes no tiene movimientos (en ninguna moneda).
1. **Sin movimientos en esta moneda:** hay movimientos, pero ninguno en la moneda elegida. Panel sin color de estado y sin emoji.
1. **Te pasaste:** algún presupuesto de esa moneda está pasado (estado `exceeded` de la spec 005). Se nombra el que más se pasó.
1. **Te pasaste (sin presupuesto):** el resultado del mes es negativo.
1. **Ajustado:** algún presupuesto de esa moneda está cerca del límite (estado `warning`, 80 %). Se nombra el de mayor porcentaje.
1. **Va bien:** todo lo demás.

Mensajes (español rioplatense, tono que acompaña y no reta):

| Estado                       | Etiqueta   | Emoji | Mensaje                                                                 |
| ---------------------------- | ---------- | ----- | ----------------------------------------------------------------------- |
| Va bien                      | Vas bien   | ✨    | ¡Vas bárbaro! Este mes te sobran $ 412.300.                             |
| Ajustado                     | Ajustado   | 🫣    | Ojo: Supermercado ya va por el 82 %.                                    |
| Te pasaste                   | Te pasaste | 💦    | Te pasaste en Restaurantes. Tranqui, todavía queda mes para acomodarlo. |
| Negativo                     | Te pasaste | 💦    | Este mes salió más de lo que entró.                                     |
| Sin movimientos en la moneda | —          | —     | Este mes no hay movimientos en dólares.                                 |
| Vacío                        | —          | 🌱    | Arranquemos octubre: todavía no cargaste nada.                          |

Los montos del mensaje se muestran redondeados al peso, sin centavos. "Tranqui, todavía queda mes para acomodarlo" solo se dice en el mes actual y antes de su último día. Un nombre de categoría de más de 24 caracteres se corta con "…". Va bien con resultado cero: "Este mes quedaste justo."

### Inicio

- **Saludo:** el chanchito 3D sobre una forma de sol que gira despacio, con el emoji del estado en la esquina, el saludo según la hora con su emoji (🌅 ☀️ 🌙), sin nombre, y el mensaje del estado. El chanchito aparece solo en Inicio.
- **Panel del mes:** degradé sutil que nace en la esquina superior izquierda con el color del estado y se disuelve en el color del panel. La etiqueta del estado (ícono y texto) y el monto llevan el color fuerte; el resto, el texto normal.
- **Presupuestos:** debajo de los últimos movimientos, hasta 3 presupuestos de la moneda elegida (primero los pasados, después los ajustados), cada uno con tinte suave plano, su emoji y su estado. "Ver todos" lleva a Presupuestos. Si no hay presupuestos, no se muestra.
- **Vacío:** en lugar del panel del mes, un texto amable, "Cargar el primero" e ideas para empezar.
- Al cambiar de moneda o de mes, el color cambia con una transición y el emoji del estado hace un "pop".

### Colores de los estados

|            | Oscuro (tinte / brillo / fuerte)  | Claro (tinte / brillo / fuerte)   |
| ---------- | --------------------------------- | --------------------------------- |
| Va bien    | `#172a19` / `#1f4a28` / `#7dff9e` | `#dcf3d8` / `#b6f5bd` / `#006e2c` |
| Ajustado   | `#262313` / `#4a3a07` / `#ffe08a` | `#f6efd2` / `#ffe7a3` / `#6b5000` |
| Te pasaste | `#2a1918` / `#5a221d` / `#ffb4ab` | `#f8e3df` / `#ffd0c9` / `#a4161a` |

El estado nunca se comunica solo con color: siempre va con su etiqueta y su ícono.

### Formas expresivas

- Seis formas: galleta, trébol, cuadrado suave, pentágono, sol y flor. Todas con la misma cantidad de puntos, así una se transforma en otra con una transición de CSS.
- **Categorías:** cada mosaico tiene su emoji en una forma, asignada según la categoría (siempre la misma para la misma categoría). Al pasar el mouse la forma gira; la elegida en un selector se transforma en flor.
- **Movimientos y presupuestos:** el emoji va en una galleta; al pasar el mouse se transforma en flor.
- **Botón "+":** galleta en celular y en el menú minimizado.
- Con movimiento reducido: sin giros ni transformaciones.

## Criterios de aceptación

- [x] **core:** `monthMood` devuelve vacío, te pasaste, negativo, ajustado o va bien según las reglas y su orden, y elige el presupuesto correcto
- [x] **core:** `moodMessage` arma cada mensaje con montos sin centavos y no dice "todavía queda mes" el último día
- [x] **core:** `dayPart` y `greeting` cubren los límites (4:59, 5:00, 11:59, 12:00, 19:59, 20:00)
- [x] Inicio muestra el saludo, el chanchito con el emoji del estado y el mensaje, para la moneda elegida
- [x] El panel del mes y la etiqueta reflejan el estado; la etiqueta tiene texto e ícono
- [x] Inicio muestra hasta 3 presupuestos de la moneda elegida, pasados primero
- [x] Un mes sin movimientos muestra el estado vacío con "Cargar el primero"
- [x] Cada categoría muestra siempre la misma forma
- [x] Todo el texto cumple 4.5:1 sobre los tintes y degradés, en claro y en oscuro
- [x] Con movimiento reducido no hay giros, transformaciones de forma ni "pop"

## Casos borde

- Mes con presupuestos en una moneda y movimientos solo en la otra: el estado de cada moneda usa solo sus datos
- Varios presupuestos pasados: se nombra el que más se pasó en porcentaje
- Resultado exactamente cero, sin presupuestos: va bien ("Este mes quedaste justo.")
- Mes que no es el actual: los mensajes no hablan de "queda mes" (ya terminó o no empezó)
- Moneda sin movimientos en un mes que sí tiene: "Este mes no hay movimientos en dólares.", sin color de estado

## Tareas

- [x] Spec 008
- [x] `core`: `monthMood`, `moodMessage`, `dayPart` y `greeting`, con tests primero
- [x] `web`: emojis de estado y del saludo (Fluent 3D), chanchito grande
- [x] `web`: formas expresivas (generador y componente) y su uso en categorías, movimientos y botón "+"
- [x] `web`: Inicio con saludo, chanchito, panel con degradé y presupuestos
- [x] `web`: estado vacío de Inicio
- [x] Repaso de contraste y movimiento reducido, PR a `develop`

## Decisiones y notas

- Degradé sutil solo en el panel del mes y tinte plano en los presupuestos (la "mezcla" de D4): el degradé con significado le da vida al dato principal; repetido en cada fila sería ruido. Actualiza lo decidido en la spec 006 ("sin degradados") solo para este panel.
- Colores suaves en vez de los contenedores fuertes de Material: los fuertes (D1 y D3 en su primera versión) resultaban demasiado llamativos.
- "Te pasaste" en rojo amortiguado y con un mensaje que tranquiliza: la app acompaña, no reta.
- Las reglas del estado viven en `core`, para reutilizarlas en la app mobile.
- El saludo va sin nombre: la app no guarda el nombre de la persona y no vale la pena sumar un dato solo para eso.
- Formas variadas por categoría (como en D2) y no una sola: le dan identidad a cada categoría sin sumar color.
- El chanchito aparece solo en Inicio: en el resto de las pantallas sería repetitivo.
