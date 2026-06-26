import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { queryClient } from '@/api/query-client';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ReminderSync } from '@/components/reminder-sync';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <ReminderSync />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="room/[roomId]" options={{ title: 'Room' }} />
          <Stack.Screen name="device/[deviceId]" options={{ title: 'Device' }} />
          <Stack.Screen name="task/[taskId]" options={{ title: 'Task' }} />
          <Stack.Screen name="scan" options={{ title: 'Scan QR' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
