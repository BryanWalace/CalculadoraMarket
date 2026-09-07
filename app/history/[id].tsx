import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { getListWithItems } from '../../src/db/listsQueries';
import type { ListItem, ShoppingList } from '../../src/db/schema';
import { useCartStore } from '../../src/features/cart/store';
import { formatCurrencyBRL, formatDate, formatQuantity } from '../../src/lib/format';

export default function HistoryDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reopenFromHistory = useCartStore((state) => state.reopenFromHistory);
  const [data, setData] = useState<{ list: ShoppingList; items: ListItem[] } | null | undefined>(
    undefined,
  );

  useEffect(() => {
    getListWithItems(db, Number(id)).then(setData);
  }, [db, id]);

  async function performReopen() {
    await reopenFromHistory(db, Number(id));
    router.push('/');
  }

  async function discardActiveAndReopen() {
    await useCartStore.getState().clearList(db);
    await performReopen();
  }

  async function finalizeActiveAndReopen() {
    const fallbackName = `Compra de ${formatDate(new Date().toISOString())}`;
    await useCartStore.getState().finalizeList(db, fallbackName, null);
    await performReopen();
  }

  // RF-44: nunca substitui um carrinho ativo em silêncio.
  function handleReopen() {
    const { activeList, items } = useCartStore.getState();
    if (!activeList || items.length === 0) {
      void performReopen();
      return;
    }

    Alert.alert(
      'Carrinho em andamento',
      'Você já tem um carrinho em andamento. Finalize ou descarte antes de reabrir esta compra.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descartar carrinho atual',
          style: 'destructive',
          onPress: () => void discardActiveAndReopen(),
        },
        { text: 'Finalizar carrinho atual', onPress: () => void finalizeActiveAndReopen() },
      ],
    );
  }

  if (data === undefined) {
    return (
      <View style={styles.centered}>
        <Text>Carregando…</Text>
      </View>
    );
  }

  if (data === null) {
    return (
      <View style={styles.centered}>
        <Text>Compra não encontrada.</Text>
      </View>
    );
  }

  const { list, items } = data;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{list.name}</Text>
        {list.finishedAt ? <Text>{formatDate(list.finishedAt)}</Text> : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.row} accessibilityLabel={`Item ${item.name}`}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text>
              {formatQuantity(item.quantity, item.unit)} {item.unit} ×{' '}
              {formatCurrencyBRL(item.unitPrice)}
            </Text>
            <Text style={styles.itemSubtotal}>{formatCurrencyBRL(item.subtotal)}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Text accessibilityLabel="Total da compra" style={styles.total}>
          {formatCurrencyBRL(list.total)}
        </Text>
        <Pressable
          onPress={handleReopen}
          accessibilityRole="button"
          accessibilityLabel="Reabrir como carrinho novo"
          style={styles.reopenButton}
        >
          <Text style={styles.reopenButtonText}>Reabrir como carrinho novo</Text>
        </Pressable>
      </View>
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
  header: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  row: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemName: {
    fontWeight: 'bold',
  },
  itemSubtotal: {
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  reopenButton: {
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  reopenButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
