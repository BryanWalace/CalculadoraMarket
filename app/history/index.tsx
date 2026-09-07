import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { listFinishedLists } from '../../src/db/listsQueries';
import type { ShoppingList } from '../../src/db/schema';
import { HistoryListItem } from '../../src/features/history/components/HistoryListItem';
import { SummaryCard } from '../../src/features/history/components/SummaryCard';
import { calculateMonthSummary } from '../../src/lib/money';
import { useAppColors } from '../../src/lib/theme';

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const colors = useAppColors();
  const [lists, setLists] = useState<ShoppingList[] | null>(null);

  useEffect(() => {
    listFinishedLists(db).then(setLists);
  }, [db]);

  if (lists === null) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Carregando…</Text>
      </View>
    );
  }

  if (lists.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Nenhuma compra finalizada ainda</Text>
        <Text style={{ color: colors.textSecondary }}>
          Suas compras aparecem aqui depois de finalizadas.
        </Text>
      </View>
    );
  }

  const summary = calculateMonthSummary(lists, new Date());

  return (
    <FlatList
      data={lists}
      keyExtractor={(list) => String(list.id)}
      style={{ backgroundColor: colors.background }}
      ListHeaderComponent={<SummaryCard summary={summary} />}
      renderItem={({ item }) => (
        <HistoryListItem list={item} onPress={() => router.push(`/history/${item.id}`)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
