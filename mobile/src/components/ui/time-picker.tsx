import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatTimeOfDay } from '@/utils/format';

type TimeOfDayPickerProps = {
  label: string;
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
};

/**
 * iPhone-style time-of-day picker: a tappable time pill that reveals the
 * native wheel (spinner on iOS, dialog on Android).
 */
export function TimeOfDayPicker({
  label,
  hour,
  minute,
  onChange,
}: TimeOfDayPickerProps) {
  const [show, setShow] = useState(false);

  const value = new Date();
  value.setHours(hour, minute, 0, 0);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    // Android shows a one-shot dialog; close it after a selection/dismiss.
    if (Platform.OS !== 'ios') setShow(false);
    if (event.type === 'dismissed' || !date) return;
    onChange(date.getHours(), date.getMinutes());
  };

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setShow((value) => !value)} style={styles.row}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedView type="backgroundSelected" style={styles.pill}>
          <ThemedText type="small">{formatTimeOfDay(hour, minute)}</ThemedText>
        </ThemedView>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={value}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.one },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
});
