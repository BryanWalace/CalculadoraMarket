import * as Haptics from 'expo-haptics';

import { notifyBudgetExceeded, notifyItemAdded } from './haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Warning: 'warning' },
}));

describe('notifyItemAdded', () => {
  it('dispara um toque leve', () => {
    notifyItemAdded();

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('não propaga erro quando o motor de vibração falha', async () => {
    (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('sem suporte'));

    expect(() => notifyItemAdded()).not.toThrow();
    await Promise.resolve();
  });
});

describe('notifyBudgetExceeded', () => {
  it('dispara um toque de alerta', () => {
    notifyBudgetExceeded();

    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Warning,
    );
  });

  it('não propaga erro quando o motor de vibração falha', async () => {
    (Haptics.notificationAsync as jest.Mock).mockRejectedValueOnce(new Error('sem suporte'));

    expect(() => notifyBudgetExceeded()).not.toThrow();
    await Promise.resolve();
  });
});
