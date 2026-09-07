import * as Haptics from 'expo-haptics';

/**
 * Feedback tátil é cosmético: falhas (aparelho sem motor de vibração,
 * plataforma sem suporte) nunca podem interromper a ação de verdade
 * (adicionar item, salvar orçamento). RF-59.
 */
function safeHaptic(trigger: () => Promise<void>): void {
  trigger().catch(() => undefined);
}

/** Toque leve ao adicionar um item ao carrinho. */
export function notifyItemAdded(): void {
  safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Toque de alerta ao o total do carrinho ultrapassar o orçamento definido. */
export function notifyBudgetExceeded(): void {
  safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
