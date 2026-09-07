import { StyleSheet, View } from 'react-native';

export interface BudgetProgressBarProps {
  totalCents: number;
  budgetCents: number;
}

/** RF-35: barra de progresso do total gasto em relação ao orçamento definido. */
export function BudgetProgressBar({ totalCents, budgetCents }: BudgetProgressBarProps) {
  const ratio = budgetCents > 0 ? totalCents / budgetCents : 0;
  const widthPercent = Math.min(100, Math.max(0, ratio * 100));

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: budgetCents, now: Math.min(totalCents, budgetCents) }}
      accessibilityLabel="Progresso do orçamento"
    >
      <View
        style={[styles.fill, { width: `${widthPercent}%` }, ratio > 1 && styles.fillOverBudget]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  fillOverBudget: {
    backgroundColor: '#dc2626',
  },
});
