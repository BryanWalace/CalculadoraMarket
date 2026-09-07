import { StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '../../../lib/theme';

export function EmptyState() {
  const colors = useAppColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Seu carrinho está vazio</Text>
      <Text style={{ color: colors.textSecondary }}>
        Toque no botão de câmera para fotografar a primeira etiqueta.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
