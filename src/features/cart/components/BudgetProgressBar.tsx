import { StyleSheet, View } from 'react-native';

import { useAppColors } from '../../../lib/theme';

export interface BudgetProgressBarProps {
  totalCents: number;
  budgetCents: number;
}

/** RF-35: barra de progresso do total gasto em relação ao orçamento definido. */
export function BudgetProgressBar({ totalCents, budgetCents }: BudgetProgressBarProps) {
  const colors = useAppColors();
  const ratio = budgetCents > 0 ? totalCents / budgetCents : 0;
  const widthPercent = Math.min(100, Math.max(0, ratio * 100));

  return (
    <View
      style={[styles.track, { backgroundColor: colors.track }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: budgetCents, now: Math.min(totalCents, budgetCents) }}
      accessibilityLabel="Progresso do orçamento"
    >
      <View
        style={[
          styles.fill,
          { width: `${widthPercent}%`, backgroundColor: colors.primary },
          ratio > 1 && { backgroundColor: colors.danger },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
