import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { useCartStore } from '../../src/features/cart/store';
import { ItemForm } from '../../src/features/scanner/components/ItemForm';

export default function ConfirmationScreen() {
  const db = useSQLiteContext();
  const { itemId, photoUri, name, priceCents, unit } = useLocalSearchParams<{
    itemId?: string;
    photoUri?: string;
    name?: string;
    priceCents?: string;
    unit?: string;
  }>();
  const addItem = useCartStore((state) => state.addItem);
  const updateItem = useCartStore((state) => state.updateItem);
  const items = useCartStore((state) => state.items);

  const editingItem = itemId ? items.find((item) => item.id === Number(itemId)) : undefined;

  // Vem da câmera (RF-23): pré-preenche só o que o OCR reconheceu (RF-24
  // deixa o resto em branco, já que os campos ausentes usam o padrão do
  // ItemForm).
  const ocrInitialValues = photoUri
    ? {
        name: name ?? '',
        unitPriceCents: priceCents !== undefined ? Number(priceCents) : 0,
        unit: unit === 'kg' ? ('kg' as const) : ('un' as const),
      }
    : undefined;

  const initialValues = editingItem
    ? {
        name: editingItem.name,
        unitPriceCents: editingItem.unitPrice,
        quantity: editingItem.quantity,
        unit: editingItem.unit,
      }
    : ocrInitialValues;

  return (
    <ItemForm
      initialValues={initialValues}
      onSubmit={async (input) => {
        if (editingItem) {
          await updateItem(db, editingItem.id, input);
        } else {
          await addItem(db, input, photoUri ?? null);
        }
        router.back();
      }}
      onCancel={() => router.back()}
    />
  );
}
