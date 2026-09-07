import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatDate } from '../../../lib/format';

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
    <View style={styles.container}>
      <Text style={styles.title}>Finalizar compra</Text>

      <Text style={styles.label}>Loja (opcional)</Text>
      <TextInput
        style={styles.input}
        value={store}
        onChangeText={handleStoreChange}
        placeholder="Nome do mercado"
        accessibilityLabel="Loja"
      />

      <Text style={styles.label}>Nome da compra</Text>
      <TextInput
        style={styles.input}
        value={displayedName}
        onChangeText={handleNameChange}
        accessibilityLabel="Nome da compra"
      />

      <View style={styles.actionsRow}>
        <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancelar">
          <Text>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={handleConfirm}
          disabled={!displayedName.trim()}
          accessibilityRole="button"
          accessibilityLabel="Finalizar"
        >
          <Text>Finalizar</Text>
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
});
