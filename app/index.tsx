import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../src/features/cart/components/EmptyState';
import { ItemCard } from '../src/features/cart/components/ItemCard';
import {
  selectItemCount,
  selectTotalCents,
  selectUnitSum,
  useCartStore,
} from '../src/features/cart/store';
import { formatCartSummary, formatCurrencyBRL } from '../src/lib/format';

export default function CartScreen() {
  const db = useSQLiteContext();
  const isHydrated = useCartStore((state) => state.isHydrated);
  const items = useCartStore((state) => state.items);
  const hydrate = useCartStore((state) => state.hydrate);
  const totalCents = useCartStore(selectTotalCents);
  const itemCount = useCartStore(selectItemCount);
  const unitSum = useCartStore(selectUnitSum);

  useEffect(() => {
    hydrate(db);
  }, [db, hydrate]);

  if (!isHydrated) {
    return (
      <View style={styles.centered}>
        <Text>Carregando…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => router.push(`/scanner/confirm?itemId=${item.id}`)}
            />
          )}
        />
      )}

      <View style={styles.footer}>
        <Text accessibilityLabel="Total geral" style={styles.total}>
          {formatCurrencyBRL(totalCents)}
        </Text>
        <Text>{formatCartSummary(itemCount, unitSum)}</Text>
      </View>

      <Pressable
        onPress={() => router.push('/scanner/camera')}
        accessibilityRole="button"
        accessibilityLabel="Fotografar etiqueta"
        style={styles.fab}
      >
        <Text style={styles.fabIcon}>📷</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  total: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 96,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  fabIcon: {
    fontSize: 24,
  },
});
