import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ToggleProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

/** A labeled checkbox-style toggle. */
export function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.row}>
      <View style={[styles.box, value && styles.boxOn]}>
        {value ? <ThemedText style={styles.check}>✓</ThemedText> : null}
      </View>
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  box: {
    width: 22,
    height: 22,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: '#208AEF' },
  check: { color: '#ffffff', fontSize: 14, lineHeight: 18 },
});
