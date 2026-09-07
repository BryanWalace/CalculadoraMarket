import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { useCartStore } from '../../src/features/cart/store';
import { ItemForm } from '../../src/features/scanner/components/ItemForm';

export default function ConfirmationScreen() {
  const db = useSQLiteContext();
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const addItem = useCartStore((state) => state.addItem);
  const updateItem = useCartStore((state) => state.updateItem);
  const items = useCartStore((state) => state.items);

  const editingItem = itemId ? items.find((item) => item.id === Number(itemId)) : undefined;

  return (
    <ItemForm
      initialValues={
        editingItem
          ? {
              name: editingItem.name,
              unitPriceCents: editingItem.unitPrice,
              quantity: editingItem.quantity,
              unit: editingItem.unit,
            }
          : undefined
      }
      onSubmit={async (input) => {
        if (editingItem) {
          await updateItem(db, editingItem.id, input);
        } else {
          await addItem(db, input, null);
        }
        router.back();
      }}
      onCancel={() => router.back()}
    />
  );
}
