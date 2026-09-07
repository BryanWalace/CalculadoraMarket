import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatCurrencyBRL } from '../../../lib/format';
import { shoppingListInputSchema } from '../../../lib/validation';

export interface BudgetDialogProps {
  currentBudgetCents: number | null;
  onConfirm: (budgetCents: number | null) => void;
  onCancel: () => void;
}

/** RF-34: orçamento opcional por carrinho, em centavos; campo vazio remove o orçamento. */
export function BudgetDialog({ currentBudgetCents, onConfirm, onCancel }: BudgetDialogProps) {
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
    <View style={styles.container}>
      <Text style={styles.title}>Definir orçamento</Text>

      <Text style={styles.label}>Orçamento (deixe em branco para remover)</Text>
      <TextInput
        style={styles.input}
        value={isEmpty ? '' : formatCurrencyBRL(cents)}
        onChangeText={handleChange}
        keyboardType="numeric"
        placeholder="R$ 0,00"
        accessibilityLabel="Orçamento"
      />

      <View style={styles.actionsRow}>
        <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancelar">
          <Text>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={handleConfirm}
          disabled={!validation.success}
          accessibilityRole="button"
          accessibilityLabel="Salvar orçamento"
          accessibilityState={{ disabled: !validation.success }}
          style={!validation.success && styles.disabledButton}
        >
          <Text>Salvar</Text>
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
  disabledButton: {
    opacity: 0.5,
  },
});
