import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  // After a few seconds, hint that the free-tier server may be waking up.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.center}>
      <ActivityIndicator />
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      {slow ? (
        <ThemedText
          themeColor="textSecondary"
          type="small"
          style={styles.centerText}>
          Waking up the server — the first load can take up to a minute.
        </ThemedText>
      ) : null}
    </View>
  );
}

export function ErrorView({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const message = error instanceof Error ? error.message : 'Something went wrong';
  return (
    <View style={styles.center}>
      <ThemedText type="smallBold">Couldn&apos;t load data</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.centerText}>
        {message}
      </ThemedText>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyView({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <ThemedText themeColor="textSecondary" style={styles.centerText}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  centerText: { textAlign: 'center' },
});
