import { formatMovementAmount, type Movement } from '@chanchito/core'
import { StyleSheet, View } from 'react-native'
import { AppText } from '@/components/AppText'
import { CategoryEmoji } from '@/components/CategoryEmoji'
import { useTheme } from '@/theme/use-theme'

/** A movement as a row: its category's emoji, name, description and signed amount. */
export function MovementItem({ movement }: { movement: Movement }) {
  const { colors } = useTheme()
  const { category } = movement
  return (
    <View style={styles.row}>
      <View style={[styles.emoji, { backgroundColor: colors.surface }]}>
        <CategoryEmoji emoji={category.emoji} />
      </View>
      <View style={styles.text}>
        <AppText weight="semibold" numberOfLines={1}>
          {category.name}
          {category.archived && (
            <AppText size="caption" muted>
              {'  '}(archivada)
            </AppText>
          )}
        </AppText>
        <AppText size="caption" muted numberOfLines={1}>
          {movement.description ?? 'Sin descripción'}
        </AppText>
      </View>
      <AppText
        mono
        weight="medium"
        color={category.kind === 'income' ? colors.income : undefined}
        style={styles.amount}
      >
        {formatMovementAmount(movement)}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  emoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  // Large amounts keep their size; the name gives way
  amount: { flexShrink: 0 },
})
