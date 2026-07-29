import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  /** Colored left stripe, e.g. status/urgency. */
  accentColor?: string;
};

/** A rounded surface card; pressable when `onPress` is provided. */
export function Card({ children, onPress, accentColor }: CardProps) {
  const cardStyle = [
    styles.card,
    accentColor
      ? { borderLeftWidth: 4, borderLeftColor: accentColor }
      : null,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={cardStyle}>
          {children}
        </ThemedView>
      </Pressable>
    );
  }
  return (
    <ThemedView type="backgroundElement" style={cardStyle}>
      {children}
    </ThemedView>
  );
}

export function CardRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  pressed: { opacity: 0.7 },
});
