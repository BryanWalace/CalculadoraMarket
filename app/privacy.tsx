import { StyleSheet, Text, View } from 'react-native';

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <Text>Privacidade</Text>
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
