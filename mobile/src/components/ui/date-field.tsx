import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type DateFieldProps = {
  label: string;
  /** ISO date (YYYY-MM-DD) or empty string. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** A date input you can either type into (YYYY-MM-DD) or pick from a calendar. */
export function DateField({ label, value, onChange, placeholder }: DateFieldProps) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  // Noon avoids timezone off-by-one when the picker echoes the date back.
  const pickerValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date();

  const onPicked = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && date) onChange(toIsoDate(date));
  };

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? 'YYYY-MM-DD'}
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.input,
            {
              color: theme.text,
              backgroundColor: theme.background,
              borderColor: theme.backgroundSelected,
            },
          ]}
        />
        {Platform.OS !== 'web' ? (
          <Pressable
            onPress={() => setShowPicker((s) => !s)}
            style={[
              styles.pickButton,
              { backgroundColor: theme.backgroundSelected },
            ]}
            accessibilityLabel={`Pick ${label} from calendar`}>
            <ThemedText type="small">📅</ThemedText>
          </Pressable>
        ) : null}
      </View>
      {showPicker && Platform.OS !== 'web' ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onPicked}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one },
  row: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    minHeight: 44,
  },
  pickButton: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
