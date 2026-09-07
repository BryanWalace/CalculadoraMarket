import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatCurrencyBRL } from '../../../lib/format';
import { useAppColors } from '../../../lib/theme';
import { shoppingListInputSchema } from '../../../lib/validation';

export interface BudgetDialogProps {
  currentBudgetCents: number | null;
  onConfirm: (budgetCents: number | null) => void;
  onCancel: () => void;
}

/** RF-34: orçamento opcional por carrinho, em centavos; campo vazio remove o orçamento. */
export function BudgetDialog({ currentBudgetCents, onConfirm, onCancel }: BudgetDialogProps) {
  const colors = useAppColors();
  const [cents, setCents] = useState(currentBudgetCents ?? 0);
  const [isEmpty, setIsEmpty] = useState(currentBudgetCents === null);

  const validation = shoppingListInputSchema.shape.budget.safeParse(isEmpty ? null : cents);

  function handleChange(text: string) {
    const digitsOnly = text.replace(/\D/g, '');
    if (digitsOnly === '') {
      setIsEmpty(true);
      setCents(0);
      return;
    }
    setIsEmpty(false);
    setCents(parseInt(digitsOnly, 10));
  }

  function handleConfirm() {
    if (!validation.success) {
      return;
    }
    onConfirm(validation.data ?? null);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Definir orçamento</Text>

      <Text style={[styles.label, { color: colors.text }]}>
        Orçamento (deixe em branco para remover)
      </Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={isEmpty ? '' : formatCurrencyBRL(cents)}
        onChangeText={handleChange}
        keyboardType="numeric"
        placeholder="R$ 0,00"
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel="Orçamento"
      />

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
          style={styles.actionButton}
        >
          <Text style={{ color: colors.text }}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={handleConfirm}
          disabled={!validation.success}
          accessibilityRole="button"
          accessibilityLabel="Salvar orçamento"
          accessibilityState={{ disabled: !validation.success }}
          style={[styles.actionButton, !validation.success && styles.disabledButton]}
        >
          <Text style={{ color: colors.primary }}>Salvar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
