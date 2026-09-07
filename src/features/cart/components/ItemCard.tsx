import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ListItem } from '../../../db/schema';
import { formatCurrencyBRL, formatQuantity } from '../../../lib/format';
import { useAppColors } from '../../../lib/theme';

interface ItemCardProps {
  item: ListItem;
  onPress: () => void;
  onDelete: () => void;
  /** Omitido para itens `kg` — sem botão rápido no card (RF-28/29). */
  onAdjustQuantity?: (delta: number) => void;
}

export function ItemCard({ item, onPress, onDelete, onAdjustQuantity }: ItemCardProps) {
  const colors = useAppColors();

  return (
    <View style={[styles.card, { borderBottomColor: colors.border }]}>
      <Pressable
        style={styles.info}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Item ${item.name}, toque para editar`}
      >
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <Text style={{ color: colors.textSecondary }}>
          {formatQuantity(item.quantity, item.unit)} {item.unit} ×{' '}
          {formatCurrencyBRL(item.unitPrice)}
        </Text>
        <Text
          style={[styles.subtotal, { color: colors.text }]}
          accessibilityLabel={`Subtotal de ${item.name}`}
        >
          {formatCurrencyBRL(item.subtotal)}
        </Text>
      </Pressable>

      {item.unit === 'un' && onAdjustQuantity ? (
        <View style={styles.quantityRow}>
          <Pressable
            onPress={() => onAdjustQuantity(-1)}
            accessibilityRole="button"
            accessibilityLabel={`Diminuir quantidade de ${item.name}`}
            style={[styles.quantityButton, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text }}>−</Text>
          </Pressable>
          <Pressable
            onPress={() => onAdjustQuantity(1)}
            accessibilityRole="button"
            accessibilityLabel={`Aumentar quantidade de ${item.name}`}
            style={[styles.quantityButton, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text }}>+</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`Excluir ${item.name}`}
        style={styles.deleteButton}
      >
        <Text>🗑</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
    padding: 16,
  },
  name: {
    fontWeight: 'bold',
  },
  subtotal: {
    fontWeight: 'bold',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  quantityButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  deleteButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
});
