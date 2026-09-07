import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CaptureGuideOverlay } from '../../src/features/scanner/components/CaptureGuideOverlay';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  if (permission?.granted) {
    return (
      <View style={styles.container}>
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
        <CaptureGuideOverlay />
      </View>
    );
  }

  // Negada de vez (usuário já recusou e o sistema não pergunta mais): a
  // câmera nunca trava o app, sempre oferece o caminho manual (RF-13).
  if (permission && !permission.canAskAgain) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Câmera indisponível</Text>
        <Text style={styles.explanation}>
          A permissão de câmera foi negada. Você ainda pode adicionar o item digitando os dados
          manualmente.
        </Text>
        <Pressable
          onPress={() => router.push('/scanner/confirm')}
          accessibilityRole="button"
          accessibilityLabel="Adicionar manualmente"
          style={styles.button}
        >
          <Text style={styles.buttonText}>Adicionar manualmente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Precisamos da câmera</Text>
      <Text style={styles.explanation}>
        A câmera é usada só para fotografar a etiqueta de preço e ler o texto direto no aparelho.
        Nenhuma foto sai do celular.
      </Text>
      <Pressable
        onPress={requestPermission}
        accessibilityRole="button"
        accessibilityLabel="Permitir câmera"
        style={styles.button}
      >
        <Text style={styles.buttonText}>Permitir câmera</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/scanner/confirm')}
        accessibilityRole="button"
        accessibilityLabel="Adicionar manualmente"
      >
        <Text>Prefiro digitar manualmente</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  explanation: {
    textAlign: 'center',
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
