import { StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '../src/lib/theme';

export default function PrivacyScreen() {
  const colors = useAppColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text }}>Privacidade</Text>
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
