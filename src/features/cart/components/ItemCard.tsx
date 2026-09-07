import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ListItem } from '../../../db/schema';
import { formatCurrencyBRL, formatQuantity } from '../../../lib/format';

interface ItemCardProps {
  item: ListItem;
  onPress: () => void;
  /** Omitido para itens `kg` — sem botão rápido no card (RF-28/29). */
  onAdjustQuantity?: (delta: number) => void;
}

export function ItemCard({ item, onPress, onAdjustQuantity }: ItemCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        style={styles.info}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Item ${item.name}, toque para editar`}
      >
        <Text style={styles.name}>{item.name}</Text>
        <Text>
          {formatQuantity(item.quantity, item.unit)} {item.unit} ×{' '}
          {formatCurrencyBRL(item.unitPrice)}
        </Text>
        <Text style={styles.subtotal} accessibilityLabel={`Subtotal de ${item.name}`}>
          {formatCurrencyBRL(item.subtotal)}
        </Text>
      </Pressable>

      {item.unit === 'un' && onAdjustQuantity ? (
        <View style={styles.quantityRow}>
          <Pressable
            onPress={() => onAdjustQuantity(-1)}
            accessibilityRole="button"
            accessibilityLabel={`Diminuir quantidade de ${item.name}`}
            style={styles.quantityButton}
          >
            <Text>−</Text>
          </Pressable>
          <Pressable
            onPress={() => onAdjustQuantity(1)}
            accessibilityRole="button"
            accessibilityLabel={`Aumentar quantidade de ${item.name}`}
            style={styles.quantityButton}
          >
            <Text>+</Text>
          </Pressable>
        </View>
      ) : null}
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
});
