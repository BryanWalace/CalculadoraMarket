import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatDate } from '../../../lib/format';
import { useAppColors } from '../../../lib/theme';

export interface FinalizeDialogProps {
  onConfirm: (input: { name: string; store: string | null }) => void;
  onCancel: () => void;
}

function suggestName(store: string): string {
  const today = formatDate(new Date().toISOString());
  return store.trim() ? `${store.trim()} - ${today}` : `Compra de ${today}`;
}

/** RF-38: nome sugerido (loja + data), sempre editável; loja é opcional. */
export function FinalizeDialog({ onConfirm, onCancel }: FinalizeDialogProps) {
  const colors = useAppColors();
  const [store, setStore] = useState('');
  const [name, setName] = useState(() => suggestName(''));
  const [nameTouched, setNameTouched] = useState(false);

  const displayedName = nameTouched ? name : suggestName(store);

  function handleStoreChange(text: string) {
    setStore(text);
  }

  function handleNameChange(text: string) {
    setName(text);
    setNameTouched(true);
  }

  function handleConfirm() {
    const finalName = displayedName.trim();
    if (!finalName) {
      return;
    }
    onConfirm({ name: finalName, store: store.trim() ? store.trim() : null });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Finalizar compra</Text>

      <Text style={[styles.label, { color: colors.text }]}>Loja (opcional)</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={store}
        onChangeText={handleStoreChange}
        placeholder="Nome do mercado"
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel="Loja"
      />

      <Text style={[styles.label, { color: colors.text }]}>Nome da compra</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={displayedName}
        onChangeText={handleNameChange}
        accessibilityLabel="Nome da compra"
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
          disabled={!displayedName.trim()}
          accessibilityRole="button"
          accessibilityLabel="Finalizar"
          style={styles.actionButton}
        >
          <Text style={{ color: colors.primary }}>Finalizar</Text>
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
});
