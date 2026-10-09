# 004 — Balance mensual

**Estado:** aprobada

## Objetivo

Saber cuánto entró, cuánto salió y en qué se fue la plata cada mes, en pesos y en dólares por separado. Al terminar, Inicio muestra el resultado del mes actual y la pantalla Balance muestra cualquier mes con sus totales y el desglose por categoría, con gráficos.

## Alcance

- En `packages/core`: resumen de un mes a partir de sus movimientos (totales por moneda y totales por categoría, con su porcentaje)
- Inicio: totales del mes actual por moneda y un link a Balance
- Pantalla `/balance`: un mes a la vez, con navegación entre meses en la URL (como en Movimientos), totales por moneda y gráfico de barras por categoría para gastos e ingresos
- Gráficos con Recharts

### Fuera de alcance

- Cambios en la base: el balance se calcula a partir de los movimientos, no se guarda (ver ADR 0002)
- Conversión entre monedas o un total consolidado
- Comparación con meses anteriores, evolución en el tiempo y saldo acumulado
- Links desde una categoría a sus movimientos
- Presupuestos (spec 005)

## Modelo de datos

Sin cambios en la base. En `packages/core`:

```ts
type CategoryTotal = {
  category: { id: string; name: string; kind: CategoryKind; archived: boolean }
  total: Money // > 0
  share: number // total / total del tipo en esa moneda, entre 0 y 1
}

type CurrencySummary = {
  income: Money
  expense: Money
  net: Money // income - expense; puede ser negativo
  incomeByCategory: CategoryTotal[] // de mayor a menor
  expenseByCategory: CategoryTotal[]
}

type MonthSummary = Record<Currency, CurrencySummary>
```

## Comportamiento

### Cálculo

- **Ingresos** y **Gastos** del mes son la suma de los montos de los movimientos de cada tipo, por moneda. **Resultado** = Ingresos − Gastos.
- Nunca se suman pesos y dólares: cada moneda tiene su propio resumen.
- Las categorías archivadas cuentan igual que las activas.
- Por categoría: solo aparecen las que tienen movimientos en ese mes y moneda, ordenadas de mayor a menor total; a igual total, por nombre.
- El porcentaje es el total de la categoría sobre el total de su tipo en esa moneda. Se muestra redondeado a entero (`34%`). Si es mayor a 0 pero redondea a 0, se muestra `<1%`. Por el redondeo, la suma puede no dar exactamente 100%.

### Inicio

- Título con el mes actual ("Octubre 2026").
- Una tarjeta por moneda (pesos y dólares) con Ingresos, Gastos y Resultado. Siempre se muestran las dos monedas, aunque una esté en `$ 0,00`.
- El resultado lleva signo (`+$ 1.234,56`, `-US$ 50,00`; en cero, `$ 0,00`), sin usar el color como única señal.
- Link "Ver balance" que lleva a `/balance` en el mes actual.

### Balance (`/balance`)

- Muestra un mes; por defecto, el actual. Misma navegación ← → que Movimientos, con el mes en la URL (`/balance?mes=2026-10`).
- Arriba, los totales por moneda como en Inicio.
- Debajo, una sección por moneda que tenga movimientos en el mes ("Pesos", "Dólares"), cada una con:
  - **Gastos por categoría:** gráfico de barras horizontales, una barra por categoría, con el nombre a la izquierda y el monto y el porcentaje como etiqueta.
  - **Ingresos por categoría:** igual.
  - Si un tipo no tiene movimientos en esa moneda, en lugar del gráfico: "No hay gastos en pesos este mes." (o ingresos, o dólares).
- Al pasar el mouse por una barra (o enfocarla con el teclado), un tooltip muestra categoría, monto y porcentaje.
- Cada gráfico tiene al lado su tabla con los mismos datos (categoría, monto y porcentaje), para leerlo sin el gráfico y con lector de pantalla.
- Las categorías archivadas se muestran con "(archivada)".
- Mes sin movimientos: los totales en cero y "No hay movimientos en octubre 2026." en lugar de los gráficos.
- Los datos son los mismos que los de Movimientos (misma consulta), así que cargar, editar o eliminar un movimiento actualiza el balance.

### Gráficos

- Barras horizontales, porque los nombres de categoría son largos y puede haber muchas.
- Cada gráfico es una sola serie, con un color para gastos y otro para ingresos, validados contra el fondo claro y el oscuro. El color nunca es la única señal: el título dice qué es y cada barra tiene su etiqueta.
- Barras finas con el extremo redondeado y grilla tenue. El monto se escribe en el color del texto, no en el de la barra.

## Criterios de aceptación

- [ ] Con un gasto de `1.000` ARS y un ingreso de `3.000` ARS en el mes, Inicio muestra Ingresos `$ 3.000,00`, Gastos `$ 1.000,00` y Resultado `+$ 2.000,00` en pesos, y dólares en `$ 0,00`
- [ ] Si los gastos superan los ingresos, el resultado se muestra negativo (`-US$ 50,00`)
- [ ] Los movimientos en USD no cambian los totales en ARS, y viceversa
- [ ] Los movimientos de otros meses no cuentan
- [ ] "Ver balance" lleva a `/balance` en el mes actual
- [ ] `/balance` muestra el mes actual; ← y → cambian de mes y actualizan la URL
- [ ] Con gastos de `600` en "Supermercado", `300` en "Transporte" y `100` en "Salidas" (ARS), el desglose muestra las tres en ese orden con `60%`, `30%` y `10%`
- [ ] Una categoría con una porción mayor a 0 que redondea a 0 muestra `<1%`
- [ ] Una categoría archivada con movimientos en el mes aparece con "(archivada)"
- [ ] Sin gastos en dólares en el mes, se ve "No hay gastos en dólares este mes."
- [ ] Un mes sin movimientos muestra los totales en cero y "No hay movimientos en <mes>."
- [ ] Cada gráfico tiene una tabla con categoría, monto y porcentaje
- [ ] Cargar, editar o eliminar un movimiento actualiza Inicio y Balance sin recargar

## Casos borde

- Un mes con solo ingresos o solo gastos
- Resultado exactamente cero: `$ 0,00`, sin signo
- Una sola categoría: `100%`
- Dos categorías con el mismo total: se ordenan por nombre
- Montos grandes (`1.000.000.000,00`) en varias categorías se suman sin perder precisión; si la suma superara `Number.MAX_SAFE_INTEGER`, se muestra un error en lugar de un total incorrecto
- Un `?mes=` inválido en la URL muestra el mes actual
- El mes actual se calcula con la fecha local (igual que en Movimientos)

## Tareas

- [x] Spec 004
- [ ] `core`: resumen del mes (totales por moneda y por categoría, porcentajes y su formato)
- [ ] `web`: mes en la URL reutilizable entre Movimientos y Balance
- [ ] `web`: tarjetas de totales por moneda e Inicio con el mes actual
- [ ] `web`: pantalla de Balance con navegación y tablas por categoría
- [ ] `web`: gráficos de barras por categoría con Recharts
- [ ] PR a `develop`

## Decisiones y notas

- El resumen se calcula en el cliente, en `core`, sobre los movimientos del mes que ya trae la consulta de Movimientos. Es un volumen chico, no requiere migración y comparte la caché, así que cualquier cambio en los movimientos actualiza el balance.
- Recharts para los gráficos: es la librería de gráficos más usada con React y es declarativa. Solo se usa en `apps/web`. Para mobile habrá que elegir otra, pero el cálculo queda en `core`.
- Barras horizontales en vez de torta: comparan mejor valores parecidos y admiten muchas categorías con nombres largos.
- El porcentaje se calcula en `core` y se redondea solo al mostrarlo.
