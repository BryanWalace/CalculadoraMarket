import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { buildConfirmRouteQuery, scanLabel } from '../../src/features/scanner/scanLabel';
import { CaptureGuideOverlay } from '../../src/features/scanner/components/CaptureGuideOverlay';
import type { FrameBounds } from '../../src/lib/cropRegion';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [frameBounds, setFrameBounds] = useState<FrameBounds | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  async function handleCapture() {
    if (!frameBounds || isCapturing) {
      return;
    }
    setIsCapturing(true);
    try {
      const screen = Dimensions.get('window');
      const scanResult = await scanLabel(cameraRef, frameBounds, screen);
      router.push(`/scanner/confirm?${buildConfirmRouteQuery(scanResult)}`);
    } catch {
      Alert.alert(
        'Não foi possível fotografar',
        'Tente novamente ou preencha os dados manualmente.',
        [
          { text: 'Tentar de novo', style: 'cancel' },
          { text: 'Preencher manualmente', onPress: () => router.push('/scanner/confirm') },
        ],
      );
    } finally {
      setIsCapturing(false);
    }
  }

  if (permission?.granted) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        <CaptureGuideOverlay onFrameLayout={setFrameBounds} />
        <Pressable
          onPress={handleCapture}
          disabled={!frameBounds || isCapturing}
          accessibilityRole="button"
          accessibilityLabel="Fotografar etiqueta"
          style={styles.shutter}
        >
          <View style={styles.shutterInner} />
        </Pressable>
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
  cameraContainer: {
    flex: 1,
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
  shutter: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
  },
});
