import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';

import { ItemForm } from '../../src/features/scanner/components/ItemForm';
import { useCartStore } from '../../src/features/cart/store';

export default function ConfirmationScreen() {
  const db = useSQLiteContext();
  const addItem = useCartStore((state) => state.addItem);

  return (
    <ItemForm
      onSubmit={async (input) => {
        await addItem(db, input, null);
        router.back();
      }}
      onCancel={() => router.back()}
    />
  );
}
