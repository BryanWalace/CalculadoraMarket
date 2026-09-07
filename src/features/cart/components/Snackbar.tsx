import { Pressable, StyleSheet, Text, View } from 'react-native';

interface SnackbarProps {
  message: string;
  actionLabel: string;
  onActionPress: () => void;
}

export function Snackbar({ message, actionLabel, onActionPress }: SnackbarProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.message}>{message}</Text>
      <Pressable
        onPress={onActionPress}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        style={styles.action}
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1f2937',
  },
  message: {
    color: '#ffffff',
    flex: 1,
  },
  action: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  actionText: {
    color: '#93c5fd',
    fontWeight: 'bold',
  },
});
