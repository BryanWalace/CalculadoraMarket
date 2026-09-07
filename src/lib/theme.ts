import { useColorScheme } from 'react-native';

export interface AppColors {
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  card: string;
  primary: string;
  primaryText: string;
  success: string;
  danger: string;
  track: string;
  overlay: string;
  overlayText: string;
}

const light: AppColors = {
  background: '#ffffff',
  text: '#111827',
  textSecondary: '#4b5563',
  border: '#e5e7eb',
  card: '#f9fafb',
  primary: '#2563eb',
  primaryText: '#ffffff',
  success: '#16a34a',
  danger: '#dc2626',
  track: '#e5e7eb',
  overlay: 'rgba(0, 0, 0, 0.35)',
  overlayText: '#ffffff',
};

const dark: AppColors = {
  background: '#0b1120',
  text: '#f3f4f6',
  textSecondary: '#9ca3af',
  border: '#374151',
  card: '#1f2937',
  primary: '#3b82f6',
  primaryText: '#ffffff',
  success: '#22c55e',
  danger: '#f87171',
  track: '#374151',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayText: '#ffffff',
};

/** RF-60: paleta única por tela/componente, nunca cor fixa fora deste módulo. */
export function useAppColors(): AppColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}
