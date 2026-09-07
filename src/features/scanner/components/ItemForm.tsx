import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatCurrencyBRL, formatQuantity } from '../../../lib/format';
import { multiplyCents } from '../../../lib/money';
import { useAppColors } from '../../../lib/theme';
import { listItemInputSchema, type ListItemInput, type Unit } from '../../../lib/validation';

export interface ItemFormValues {
  name: string;
  unitPriceCents: number;
  quantity: number;
  unit: Unit;
}

export interface ItemFormProps {
  initialValues?: Partial<ItemFormValues>;
  onSubmit: (input: ListItemInput) => void;
  onCancel: () => void;
  /** Aviso discreto (RF-25), ex.: "Não consegui ler a etiqueta, preencha manualmente". */
  notice?: string;
}

const DEFAULT_VALUES: ItemFormValues = {
  name: '',
  unitPriceCents: 0,
  quantity: 1,
  unit: 'un',
};

/** Passo do ajuste rápido de quantidade nesta tela: 1 unidade, ou 100g. */
const QUANTITY_STEP: Record<Unit, number> = { un: 1, kg: 0.1 };

export function ItemForm({ initialValues, onSubmit, onCancel, notice }: ItemFormProps) {
  const colors = useAppColors();
  const [values, setValues] = useState<ItemFormValues>({ ...DEFAULT_VALUES, ...initialValues });

  const subtotalCents = useMemo(
    () => multiplyCents(values.unitPriceCents, values.quantity),
    [values.unitPriceCents, values.quantity],
  );

  const validation = listItemInputSchema.safeParse({
    name: values.name,
    unitPrice: values.unitPriceCents,
    quantity: values.quantity,
    unit: values.unit,
  });

  function handlePriceChange(text: string) {
    const digitsOnly = text.replace(/\D/g, '');
    const cents = digitsOnly === '' ? 0 : parseInt(digitsOnly, 10);
    setValues((previous) => ({ ...previous, unitPriceCents: cents }));
  }

  /**
   * Para 'un', só a sequência de dígitos no início do texto é aceita — o
   * restante é descartado ao digitar, nunca concatenado (RF-09). Para 'kg',
   * aceita um separador decimal (vírgula ou ponto).
   */
  function handleQuantityChange(text: string) {
    if (values.unit === 'un') {
      const digitsOnly = text.match(/^\d*/)?.[0] ?? '';
      const parsed = digitsOnly === '' ? 0 : parseInt(digitsOnly, 10);
      setValues((previous) => ({ ...previous, quantity: parsed }));
      return;
    }

    const normalized = text.replace(',', '.').replace(/[^0-9.]/g, '');
    const parsed = parseFloat(normalized);
    setValues((previous) => ({ ...previous, quantity: Number.isNaN(parsed) ? 0 : parsed }));
  }

  function adjustQuantity(delta: number) {
    setValues((previous) => ({
      ...previous,
      quantity: Math.max(0, Number((previous.quantity + delta).toFixed(3))),
    }));
  }

  function selectUnit(unit: Unit) {
    setValues((previous) => ({
      ...previous,
      unit,
      quantity: unit === 'un' ? Math.round(previous.quantity) : previous.quantity,
    }));
  }

  function handleSubmit() {
    if (!validation.success) {
      return;
    }
    onSubmit(validation.data);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {notice ? (
        <Text style={[styles.notice, { color: colors.textSecondary }]} accessibilityRole="alert">
          {notice}
        </Text>
      ) : null}

      <Text style={[styles.label, { color: colors.text }]}>Nome</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={values.name}
        onChangeText={(text) => setValues((previous) => ({ ...previous, name: text }))}
        placeholder="Nome do produto"
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel="Nome do produto"
      />

      <Text style={[styles.label, { color: colors.text }]}>Preço unitário</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={formatCurrencyBRL(values.unitPriceCents)}
        onChangeText={handlePriceChange}
        keyboardType="numeric"
        accessibilityLabel="Preço unitário"
      />

      <Text style={[styles.label, { color: colors.text }]}>Unidade</Text>
      <View style={styles.unitRow}>
        <Pressable
          onPress={() => selectUnit('un')}
          accessibilityRole="button"
          accessibilityLabel="Unidade: un"
          style={[
            styles.unitButton,
            { borderColor: colors.border },
            values.unit === 'un' && { borderColor: colors.primary, borderWidth: 2 },
          ]}
        >
          <Text style={{ color: colors.text }}>un</Text>
        </Pressable>
        <Pressable
          onPress={() => selectUnit('kg')}
          accessibilityRole="button"
          accessibilityLabel="Unidade: kg"
          style={[
            styles.unitButton,
            { borderColor: colors.border },
            values.unit === 'kg' && { borderColor: colors.primary, borderWidth: 2 },
          ]}
        >
          <Text style={{ color: colors.text }}>kg</Text>
        </Pressable>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Quantidade</Text>
      <View style={styles.quantityRow}>
        <Pressable
          onPress={() => adjustQuantity(-QUANTITY_STEP[values.unit])}
          accessibilityRole="button"
          accessibilityLabel="Diminuir quantidade"
          style={[styles.quantityButton, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.text }}>−</Text>
        </Pressable>
        <TextInput
          style={[
            styles.input,
            styles.quantityInput,
            { borderColor: colors.border, color: colors.text },
          ]}
          value={formatQuantity(values.quantity, values.unit)}
          onChangeText={handleQuantityChange}
          keyboardType="numeric"
          accessibilityLabel="Quantidade"
        />
        <Pressable
          onPress={() => adjustQuantity(QUANTITY_STEP[values.unit])}
          accessibilityRole="button"
          accessibilityLabel="Aumentar quantidade"
          style={[styles.quantityButton, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.text }}>+</Text>
        </Pressable>
      </View>

      <Text style={[styles.subtotal, { color: colors.text }]} accessibilityLabel="Subtotal">
        Subtotal: {formatCurrencyBRL(subtotalCents)}
      </Text>

      <View style={styles.actionsRow}>
        <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancelar">
          <Text style={{ color: colors.text }}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={!validation.success}
          accessibilityRole="button"
          accessibilityLabel="Adicionar"
          accessibilityState={{ disabled: !validation.success }}
          style={!validation.success && styles.disabledButton}
        >
          <Text style={{ color: colors.primary }}>Adicionar</Text>
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
  notice: {
    fontStyle: 'italic',
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
  unitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    padding: 12,
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  quantityInput: {
    flex: 1,
    textAlign: 'center',
  },
  subtotal: {
    fontSize: 18,
    fontWeight: 'bold',
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
