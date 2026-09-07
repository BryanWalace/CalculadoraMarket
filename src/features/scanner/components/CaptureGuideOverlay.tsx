import { StyleSheet, Text, View } from 'react-native';

/**
 * Moldura visual indicando onde o usuário deve posicionar o preço da
 * etiqueta antes de fotografar (RF-14). A foto é recortada para esta mesma
 * área antes do OCR (RF-15, ver T-29).
 */
export function CaptureGuideOverlay() {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <Text style={styles.hint}>Posicione o preço dentro da moldura</Text>
      <View style={styles.frame} accessibilityLabel="Moldura de enquadramento do preço" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  hint: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  frame: {
    width: '80%',
    height: 120,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: 12,
  },
});
