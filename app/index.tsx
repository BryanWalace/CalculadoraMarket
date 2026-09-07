import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { BudgetDialog } from '../src/features/cart/components/BudgetDialog';
import { BudgetProgressBar } from '../src/features/cart/components/BudgetProgressBar';
import { EmptyState } from '../src/features/cart/components/EmptyState';
import { FinalizeDialog } from '../src/features/cart/components/FinalizeDialog';
import { ItemCard } from '../src/features/cart/components/ItemCard';
import { Snackbar } from '../src/features/cart/components/Snackbar';
import {
  selectItemCount,
  selectTotalCents,
  selectUnitSum,
  useCartStore,
} from '../src/features/cart/store';
import { formatCartSummary, formatCurrencyBRL } from '../src/lib/format';
import { useAppColors } from '../src/lib/theme';

export default function CartScreen() {
  const db = useSQLiteContext();
  const colors = useAppColors();
  const isHydrated = useCartStore((state) => state.isHydrated);
  const items = useCartStore((state) => state.items);
  const activeList = useCartStore((state) => state.activeList);
  const hydrate = useCartStore((state) => state.hydrate);
  const adjustQuantity = useCartStore((state) => state.adjustQuantity);
  const scheduleRemoval = useCartStore((state) => state.scheduleRemoval);
  const undoRemoval = useCartStore((state) => state.undoRemoval);
  const pendingDeletion = useCartStore((state) => state.pendingDeletion);
  const clearList = useCartStore((state) => state.clearList);
  const finalizeList = useCartStore((state) => state.finalizeList);
  const setBudget = useCartStore((state) => state.setBudget);
  const totalCents = useCartStore(selectTotalCents);
  const itemCount = useCartStore(selectItemCount);
  const unitSum = useCartStore(selectUnitSum);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [hydrateError, setHydrateError] = useState(false);

  useEffect(() => {
    hydrate(db).catch(() => setHydrateError(true));
  }, [db, hydrate]);

  function handleRetryHydrate() {
    setHydrateError(false);
    hydrate(db).catch(() => setHydrateError(true));
  }

  function handleClearList() {
    Alert.alert('Limpar lista', 'Isso remove todos os itens do carrinho. Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => clearList(db) },
    ]);
  }

  async function handleFinalizeConfirm(input: { name: string; store: string | null }) {
    await finalizeList(db, input.name, input.store);
    setIsFinalizing(false);
  }

  async function handleBudgetConfirm(budgetCents: number | null) {
    await setBudget(db, budgetCents);
    setIsEditingBudget(false);
  }

  if (hydrateError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Não foi possível abrir o carrinho.</Text>
        <Pressable
          onPress={handleRetryHydrate}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
          style={styles.retryButton}
        >
          <Text style={{ color: colors.primary }}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (!isHydrated) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Carregando…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleClearList}
              accessibilityRole="button"
              accessibilityLabel="Limpar lista"
              style={styles.clearButton}
            >
              <Text style={{ color: colors.text }}>Limpar lista</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsFinalizing(true)}
              accessibilityRole="button"
              accessibilityLabel="Finalizar compra"
              style={[styles.finalizeButton, { backgroundColor: colors.success }]}
            >
              <Text style={[styles.finalizeButtonText, { color: colors.primaryText }]}>
                Finalizar compra
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ItemCard
                item={item}
                onPress={() => router.push(`/scanner/confirm?itemId=${item.id}`)}
                onAdjustQuantity={(delta) => adjustQuantity(db, item.id, delta)}
                onDelete={() => scheduleRemoval(db, item.id)}
              />
            )}
          />
        </>
      )}

      {pendingDeletion ? (
        <Snackbar
          message={`"${pendingDeletion.item.name}" excluído`}
          actionLabel="Desfazer"
          onActionPress={undoRemoval}
        />
      ) : null}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text
          accessibilityLabel="Total geral"
          style={[
            styles.total,
            { color: colors.text },
            activeList?.budget != null &&
              totalCents > activeList.budget && { color: colors.danger },
          ]}
        >
          {formatCurrencyBRL(totalCents)}
        </Text>
        <Text style={{ color: colors.textSecondary }}>{formatCartSummary(itemCount, unitSum)}</Text>
        {activeList?.budget != null ? (
          <View style={styles.progressBarWrapper}>
            <BudgetProgressBar totalCents={totalCents} budgetCents={activeList.budget} />
          </View>
        ) : null}
        <Pressable
          onPress={() => setIsEditingBudget(true)}
          accessibilityRole="button"
          accessibilityLabel="Definir orçamento"
          style={styles.budgetButton}
        >
          <Text style={[styles.budgetButtonText, { color: colors.primary }]}>
            {activeList?.budget != null
              ? `Orçamento: ${formatCurrencyBRL(activeList.budget)}`
              : 'Definir orçamento'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/privacy')}
          accessibilityRole="button"
          accessibilityLabel="Privacidade"
          style={styles.privacyButton}
        >
          <Text style={{ color: colors.textSecondary }}>Privacidade</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/scanner/camera')}
        accessibilityRole="button"
        accessibilityLabel="Fotografar etiqueta"
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.fabIcon}>📷</Text>
      </Pressable>

      <Modal
        visible={isFinalizing}
        animationType="slide"
        onRequestClose={() => setIsFinalizing(false)}
      >
        <FinalizeDialog onConfirm={handleFinalizeConfirm} onCancel={() => setIsFinalizing(false)} />
      </Modal>

      <Modal
        visible={isEditingBudget}
        animationType="slide"
        onRequestClose={() => setIsEditingBudget(false)}
      >
        <BudgetDialog
          currentBudgetCents={activeList?.budget ?? null}
          onConfirm={handleBudgetConfirm}
          onCancel={() => setIsEditingBudget(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearButton: {
    padding: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  finalizeButton: {
    marginRight: 16,
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  finalizeButtonText: {
    fontWeight: 'bold',
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
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  total: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  progressBarWrapper: {
    width: '100%',
    marginTop: 8,
  },
  budgetButton: {
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  budgetButtonText: {
    textDecorationLine: 'underline',
  },
  privacyButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
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
  },
  fabIcon: {
    fontSize: 24,
  },
});
