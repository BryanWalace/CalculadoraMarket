import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { AppDatabaseProvider } from '../src/db/client';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppDatabaseProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AppDatabaseProvider>
  );
}
