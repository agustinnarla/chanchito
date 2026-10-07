# 0002 — Dinero y monedas (ARS y USD)

**Estado:** aceptada

## Contexto

Manejo pesos y dólares. Los errores de redondeo con decimales son inaceptables en una app de finanzas, y convertir entre monedas en Argentina es ambiguo (oficial, MEP, blue, tarjeta).

## Decisión

- Los montos se guardan como **enteros en centavos** (`bigint` en Postgres, `number` entero en TypeScript).
- **Cada movimiento y cada presupuesto tiene su moneda** (`ARS` | `USD`).
- **Sin conversión automática en el MVP.** Los balances y los presupuestos se muestran separados por moneda. Nunca se suman pesos y dólares.
- Un presupuesto se define por categoría, mes y moneda. Solo cuentan los gastos de esa misma moneda.

## Consecuencias

- El modelo es simple y exacto.
- No hay un "total en pesos" consolidado. Si se necesita, se agrega después con una tabla de cotizaciones y la elección explícita del tipo de cambio, sin cambiar lo existente.
- Comprar dólares con pesos no es un gasto ni un ingreso. En el MVP no se modela; queda para cuando existan cuentas.
