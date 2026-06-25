import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type BadgeProps = {
  label: string;
  color?: string;
};

/** Small colored pill, e.g. priority or status. */
export function Badge({ label, color = '#6B7280' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <ThemedText type="smallBold" style={[styles.label, { color }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.three,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 12 },
});
