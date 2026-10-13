# 010 — Bitcoin

**Estado:** aprobada

## Objetivo

Seguir una inversión en bitcoin a largo plazo: cuánto tengo, cuánto puse y cuánto vale hoy, con el precio público de Binance y sin conectar la cuenta. Diseño aprobado en el lienzo [Chanchito: direcciones visuales](https://claude.ai/artifact/CNYYPFqzfhaC26HSfSmWEa), fila "Ahorros" (E1 y E2).

## Alcance

- Sección **Inversiones** dentro de Ahorros (spec 009)
- Compras de bitcoin: fecha, cantidad y pesos pagados, con la plataforma (Binance por defecto)
- Precio de hoy desde la cotización pública de Binance en pesos (BTC/ARS), y en dólares (BTC/USDT) como referencia
- Cantidad total, lo invertido, el valor de hoy, la ganancia en pesos y en porcentaje, y el precio promedio de compra
- El total "Invertido, valor de hoy" arriba de Ahorros, en pesos y con su referencia en dólares

### Fuera de alcance

- Ventas y comisiones (se pueden registrar más adelante como compras con cantidad negativa)
- Otras criptomonedas, acciones, CEDEARs o fondos
- Conectar la cuenta de Binance o importar movimientos
- Sumar el valor de las inversiones a lo guardado en las metas (patrimonio total)
- La ganancia en dólares (necesita el dólar del día de cada compra)

## Modelo de datos

```sql
create table public.crypto_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  asset text not null default 'BTC',      -- solo 'BTC' por ahora (check)
  quantity bigint not null,               -- satoshis (1 BTC = 100.000.000), > 0
  cost bigint not null,                   -- centavos pagados, > 0, ≤ MAX_SAFE_INTEGER
  cost_currency public.currency not null default 'ARS',
  platform text not null default 'Binance', -- 1 a 30 caracteres
  occurred_on date not null,
  created_at timestamptz not null default now()
);
-- RLS por user_id = auth.uid(). Se editan cantidad, costo, plataforma y fecha.
```

En `packages/core`:

```ts
/** Una cantidad de bitcoin en satoshis: entera, como los centavos. */
type Sats = number
const SATS_PER_BTC = 100_000_000

type CryptoPurchase = { id; quantity: Sats; cost: Money; platform: string; occurredOn: IsoDate }

function parseBtc(input: string): Sats // "0,0125" → 1250000; hasta 8 decimales
function formatBtc(sats: Sats): string // 1250000 → "0,0125 BTC" (sin ceros de más)
function valueOf(sats: Sats, price: Money): Money // precio por BTC × sats / 1e8, redondeado al centavo
function summarizeHolding(purchases, price: Money | null): Holding
// Holding: quantity, invested (suma de costos en pesos), value (o null sin precio), gain, gainRatio,
// averagePrice (invested × 1e8 / quantity)
function purchasePrice(quantity: Sats, cost: Money): Money // el precio por BTC de una compra
function formatBtcForInput(sats: Sats): string // 1250000 → "0,0125", para editar
function investedThisMonth(purchases, month): Record<Currency, Money> // lo invertido en el mes
function parsePurchaseForm(values, today): PurchaseFormResult // cantidad, pesos, fecha no futura, plataforma
// monthMood (spec 008) recibe también `invested`: "Ahorraste $ 80.000 e invertiste $ 50.000, y te sobran $ 282.300."
```

Todas las cuentas con enteros (`BigInt` en los productos intermedios, como en presupuestos), sin decimales de punto flotante.

## Comportamiento

### Inversiones en Ahorros

- El panel de Bitcoin tiene el degradé sutil de la spec 008 según la ganancia: verde si gana, rojo suave si pierde, neutro sin precio.
- Muestra 🪙 en su forma, "Bitcoin", "0,0125 BTC · en Binance", **Pusiste** $ 1.450.000, **Vale hoy** $ 1.658.715 (≈ US$ 1.032) y el chip "+$ 208.715 · +14%" (o "−$ 90.000 · −6%").
- Debajo, "1 BTC = $ 132.697.202,00 (US$ 82.553,11) · Binance, actualizado hoy a las 22:40 · Precio promedio de compra $ 116.000.000,00".
- "Compras (3)" despliega la lista, la más nueva primero: fecha, "0,0035 BTC a $ 140.000.000" y lo pagado. Cada una con menú ⋮ para Editar y Eliminar.
- Sin compras: "Todavía no cargaste ninguna inversión" y el botón "Cargar una compra".

### Cargar una compra

- Diálogo con **Bitcoin comprado** (en BTC, hasta 8 decimales), **Pagaste** ($), **Fecha** (hoy por defecto) y **Plataforma** (Binance).
- Calcula al escribir: el precio de esa compra, cuánto vas a tener y el nuevo precio promedio.
- Validaciones: cantidad mayor a 0 y con hasta 8 decimales, monto mayor a 0, fecha no futura.

### Precio de hoy

- Se pide a `GET https://api.binance.com/api/v3/ticker/price?symbols=["BTCARS","BTCUSDT"]`, pública y sin claves, en un solo pedido. La respuesta (`[{ symbol: "BTCARS", price: "132697202.00000000" }, …]`) se valida con Zod y cada precio se convierte a centavos con `decimalToCents` (spec 009). El valor y la ganancia se calculan con BTC/ARS; BTC/USDT solo da la referencia "≈ US$" (USDT se toma como dólar).
- Se considera fresco por 1 minuto y se actualiza mientras la pantalla está abierta, cada 60 segundos. El último precio bueno se guarda en el navegador con su hora y se usa si Binance no responde ("Último precio: hoy a las 14:05").
- Sin ningún precio: se muestran la cantidad y lo invertido, y "No pudimos traer el precio" en lugar del valor y la ganancia.

## Criterios de aceptación

- [ ] **core:** `parseBtc` acepta "0,0125", "0.0125", "1" y "0,00000001"; rechaza más de 8 decimales, 0, negativos y texto
- [ ] **core:** `formatBtc` muestra "0,0125 BTC", "1 BTC" y "0,00000001 BTC"
- [ ] **core:** `valueOf` y `purchasePrice` calculan con enteros y redondean al centavo, también con cantidades y precios grandes
- [ ] **core:** `summarizeHolding` calcula cantidad, invertido, valor, ganancia, porcentaje y precio promedio; sin precio, valor y ganancia son nulos; sin compras, todo en cero
- [ ] **Base:** RLS; cantidad y costo positivos; solo 'BTC'; otro usuario no ve ni cambia las compras
- [ ] Cargar, editar y eliminar una compra actualiza el total y la ganancia
- [ ] Cargar una compra suma a Invertiste del mes de su fecha, en Balance e Inicio
- [ ] El precio viene de Binance (BTC/ARS y BTC/USDT); si falla, se usa el último guardado con su hora; sin ninguno, se muestra el aviso
- [ ] El panel se tiñe según la ganancia, siempre con el texto del chip (no solo color)

## Casos borde

- Una sola compra: el precio promedio es el de esa compra
- Ganancia cero: chip neutro "$ 0 · 0%"
- Cantidades muy chicas (1 satoshi) y valores con muchos dígitos: sin pérdida de precisión
- Respuesta de Binance con otro símbolo o precio inválido: se ignora y se usa el guardado
- Compra con fecha de hoy y precio muy distinto al de Binance (por ejemplo, P2P): se acepta (puede ser otra plataforma o un error de tipeo; se ve en el precio de la compra)

## Tareas

- [x] Spec 010
- [x] `core`: satoshis, `parseBtc`, `formatBtc`, `valueOf`, `purchasePrice`, `summarizeHolding`, con tests primero
- [x] Migración: tabla, restricciones y RLS; tests de base
- [x] `web`: capa de datos de compras, con sus tests contra Supabase local y su fake
- [x] `web`: precio de Binance, con el último guardado
- [ ] `web`: panel de Inversiones y diálogo de compra
- [ ] `web`: Invertiste en Balance e Inicio, y en el mensaje del chanchito
- [ ] Aplicar la migración en la nube, PR a `develop`

## Decisiones y notas

- Satoshis como enteros: la misma regla que el dinero en centavos, sin decimales en la base ni en las cuentas.
- No se conecta la cuenta de Binance: pedir claves de la cuenta es un riesgo que no vale la pena para mirar el valor. Solo se usa el precio público.
- Se cargan las compras una por una (no solo el total): así se calcula el precio promedio y la ganancia real.
- Las compras se pagan en pesos del mes, así que cuentan como **Invertiste** en Balance e Inicio (spec 009): restan de lo que te queda, pero no son gastos.
- Valor en pesos con el par BTC/ARS de Binance: compara pesos con pesos, sin pasar por una cotización del dólar. La ganancia en pesos incluye la suba del dólar; por eso se muestra también el valor de hoy en dólares como referencia.
- La hora del precio se muestra como en el dólar MEP ("actualizado hoy a las 22:40") y no como "hace 2 minutos": se refresca cada minuto, así que un texto relativo quedaría viejo enseguida.
