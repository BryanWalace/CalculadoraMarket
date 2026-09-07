import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ListItem } from '../../../db/schema';
import { formatCurrencyBRL, formatQuantity } from '../../../lib/format';

interface ItemCardProps {
  item: ListItem;
  onPress: () => void;
}

export function ItemCard({ item, onPress }: ItemCardProps) {
  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Item ${item.name}, toque para editar`}
    >
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text>
          {formatQuantity(item.quantity, item.unit)} {item.unit} ×{' '}
          {formatCurrencyBRL(item.unitPrice)}
        </Text>
        <Text style={styles.subtotal} accessibilityLabel={`Subtotal de ${item.name}`}>
          {formatCurrencyBRL(item.subtotal)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: {
    fontWeight: 'bold',
  },
  subtotal: {
    fontWeight: 'bold',
  },
});
