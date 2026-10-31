import type { Category } from '@chanchito/core'
import { Pressable, StyleSheet, View } from 'react-native'
import { useTheme } from '@/theme/use-theme'
import { AppText } from './AppText'
import { CategoryEmoji } from './CategoryEmoji'

type Props = {
  categories: readonly Category[]
  value: string
  onChange: (categoryId: string) => void
  error?: string
}

/** Categories as chips with their emoji; one can be chosen. */
export function CategoryPicker({ categories, value, onChange, error }: Props) {
  const { colors } = useTheme()
  return (
    <View style={styles.wrap}>
      <View accessibilityRole="radiogroup" accessibilityLabel="Categoría" style={styles.chips}>
        {categories.map((category) => {
          const selected = category.id === value
          const name = category.archived ? `${category.name} (archivada)` : category.name
          return (
            <Pressable
              key={category.id}
              accessibilityRole="radio"
              accessibilityLabel={name}
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(category.id)}
              style={[styles.chip, { backgroundColor: selected ? colors.active : colors.surface }]}
            >
              <CategoryEmoji emoji={category.emoji} size={22} />
              <AppText
                size="caption"
                weight="semibold"
                color={selected ? colors.activeForeground : colors.foreground}
              >
                {name}
              </AppText>
            </Pressable>
          )
        })}
      </View>
      {error && (
        <AppText size="caption" color={colors.destructive}>
          {error}
        </AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 14,
  },
})
