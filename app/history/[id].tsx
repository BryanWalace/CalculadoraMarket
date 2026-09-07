import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { getListWithItems } from '../../src/db/listsQueries';
import type { ListItem, ShoppingList } from '../../src/db/schema';
import { useCartStore } from '../../src/features/cart/store';
import { shareExportedPurchase } from '../../src/features/history/export';
import { formatCurrencyBRL, formatDate, formatQuantity } from '../../src/lib/format';
import { useAppColors } from '../../src/lib/theme';

export default function HistoryDetailScreen() {
  const db = useSQLiteContext();
  const colors = useAppColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const reopenFromHistory = useCartStore((state) => state.reopenFromHistory);
  const [data, setData] = useState<{ list: ShoppingList; items: ListItem[] } | null | undefined>(
    undefined,
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    getListWithItems(db, Number(id))
      .then(setData)
      .catch(() => setHasError(true));
  }, [db, id]);

  function handleRetry() {
    setHasError(false);
    setData(undefined);
    getListWithItems(db, Number(id))
      .then(setData)
      .catch(() => setHasError(true));
  }

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

  async function handleExport(format: 'csv' | 'text') {
    if (!data) {
      return;
    }
    try {
      await shareExportedPurchase(data.list, data.items, format);
    } catch {
      Alert.alert('Não foi possível exportar', 'Tente novamente.');
    }
  }

  if (hasError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Não foi possível carregar a compra.</Text>
        <Pressable
          onPress={handleRetry}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
          style={styles.retryButton}
        >
          <Text style={{ color: colors.primary }}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (data === undefined) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Carregando…</Text>
      </View>
    );
  }

  if (data === null) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Compra não encontrada.</Text>
      </View>
    );
  }

  const { list, items } = data;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.name, { color: colors.text }]}>{list.name}</Text>
        {list.finishedAt ? (
          <Text style={{ color: colors.textSecondary }}>{formatDate(list.finishedAt)}</Text>
        ) : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View
            style={[styles.row, { borderBottomColor: colors.border }]}
            accessibilityLabel={`Item ${item.name}`}
          >
            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
            <Text style={{ color: colors.textSecondary }}>
              {formatQuantity(item.quantity, item.unit)} {item.unit} ×{' '}
              {formatCurrencyBRL(item.unitPrice)}
            </Text>
            <Text style={[styles.itemSubtotal, { color: colors.text }]}>
              {formatCurrencyBRL(item.subtotal)}
            </Text>
          </View>
        )}
      />

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text accessibilityLabel="Total da compra" style={[styles.total, { color: colors.text }]}>
          {formatCurrencyBRL(list.total)}
        </Text>
        <Pressable
          onPress={handleReopen}
          accessibilityRole="button"
          accessibilityLabel="Reabrir como carrinho novo"
          style={[styles.reopenButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.reopenButtonText, { color: colors.primaryText }]}>
            Reabrir como carrinho novo
          </Text>
        </Pressable>
        <View style={styles.exportRow}>
          <Pressable
            onPress={() => handleExport('csv')}
            accessibilityRole="button"
            accessibilityLabel="Exportar CSV"
            style={styles.exportButton}
          >
            <Text style={{ color: colors.primary }}>Exportar CSV</Text>
          </Pressable>
          <Pressable
            onPress={() => handleExport('text')}
            accessibilityRole="button"
            accessibilityLabel="Exportar texto"
            style={styles.exportButton}
          >
            <Text style={{ color: colors.primary }}>Exportar texto</Text>
          </Pressable>
        </View>
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
    gap: 8,
  },
  retryButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
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
  },
  reopenButtonText: {
    fontWeight: 'bold',
  },
  exportRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  exportButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
});
