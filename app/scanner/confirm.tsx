import { StyleSheet, Text, View } from 'react-native';

export default function ConfirmationScreen() {
  return (
    <View style={styles.container}>
      <Text>Confirmação</Text>
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
