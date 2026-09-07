import { StyleSheet, Text, View } from 'react-native';

export default function CameraScreen() {
  return (
    <View style={styles.container}>
      <Text>Câmera</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
