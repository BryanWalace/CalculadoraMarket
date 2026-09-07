import { StyleSheet, Text, View } from 'react-native';

import type { MonthSummary } from '../../../lib/money';
import { formatCurrencyBRL } from '../../../lib/format';

interface SummaryCardProps {
  summary: MonthSummary;
}

/** RF-45, RF-46, RF-47: resumo de gastos do mês corrente. */
export function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Gasto no mês</Text>
      <Text style={styles.total} accessibilityLabel="Total do mês">
        {formatCurrencyBRL(summary.currentMonthTotalCents)}
      </Text>
      <Text accessibilityLabel="Média por compra">
        Média por compra: {formatCurrencyBRL(summary.averagePerPurchaseCents)}
      </Text>
      {summary.diffPercent === null ? (
        <Text accessibilityLabel="Comparação com o mês anterior">
          Sem compras no mês anterior para comparar
        </Text>
      ) : (
        <Text accessibilityLabel="Comparação com o mês anterior">
          {summary.diffPercent >= 0 ? '+' : ''}
          {summary.diffPercent}% frente a {formatCurrencyBRL(summary.previousMonthTotalCents)} no
          mês anterior
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  title: {
    fontWeight: 'bold',
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
