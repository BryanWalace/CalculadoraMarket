import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ShoppingList } from '../../../db/schema';
import { formatCurrencyBRL, formatDate } from '../../../lib/format';

interface HistoryListItemProps {
  list: ShoppingList;
  onPress: () => void;
}

export function HistoryListItem({ list, onPress }: HistoryListItemProps) {
  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Compra ${list.name}`}
    >
      <View>
        <Text style={styles.name}>{list.name}</Text>
        {list.finishedAt ? <Text>{formatDate(list.finishedAt)}</Text> : null}
      </View>
      <Text style={styles.total}>{formatCurrencyBRL(list.total)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: {
    fontWeight: 'bold',
  },
  total: {
    fontWeight: 'bold',
  },
});
