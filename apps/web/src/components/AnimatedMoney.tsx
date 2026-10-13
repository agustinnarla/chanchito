import { formatMoney, formatSignedMoney, type Money } from '@chanchito/core'
import { useCountUp } from '@/lib/use-count-up'

type Props = { money: Money; signed?: boolean }

/**
 * An amount that counts up to its value. A new currency starts again from 0: counting from pesos
 * to dollars would show amounts that never existed.
 */
export function AnimatedMoney({ money, signed = false }: Props) {
  return <CountUp key={money.currency} money={money} signed={signed} />
}

function CountUp({ money, signed }: Required<Props>) {
  const amount = useCountUp(money.amount)
  const shown = { amount, currency: money.currency }
  return signed ? formatSignedMoney(shown) : formatMoney(shown)
}
