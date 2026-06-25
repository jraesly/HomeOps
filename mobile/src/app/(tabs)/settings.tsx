import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { API_BASE_URL } from '@/api/config';
import { useCurrentHome } from '@/api/hooks';
import { ThemedText } from '@/components/themed-text';
import { Card, CardRow } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TimeOfDayPicker } from '@/components/ui/time-picker';
import { Toggle } from '@/components/ui/toggle';
import { Spacing } from '@/constants/theme';
import { requestReminderPermission } from '@/reminders/scheduler';
import {
  LEAD_TIME_OPTIONS,
  toggleLeadDay,
  updateSettings,
  useReminderSettings,
} from '@/reminders/settings';

export default function SettingsScreen() {
  const homeQuery = useCurrentHome();

  return (
    <Screen title="Settings">
      <Reminders />

      <Card>
        <CardRow>
          <ThemedText type="smallBold">Home</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {homeQuery.data?.name ?? '—'}
          </ThemedText>
        </CardRow>
        <CardRow>
          <ThemedText type="smallBold">Timezone</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {homeQuery.data?.timezone ?? '—'}
          </ThemedText>
        </CardRow>
      </Card>

      <Card>
        <CardRow>
          <ThemedText type="smallBold">API</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {API_BASE_URL}
          </ThemedText>
        </CardRow>
        <ThemedText type="small" themeColor="textSecondary">
          Set EXPO_PUBLIC_API_URL to point the app at your backend.
        </ThemedText>
      </Card>
    </Screen>
  );
}

function Reminders() {
  const settings = useReminderSettings();
  const [denied, setDenied] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <Card>
        <ThemedText type="smallBold">Reminders</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Task reminders are available in the mobile app.
        </ThemedText>
      </Card>
    );
  }

  const onToggleEnabled = async (next: boolean) => {
    if (!next) {
      await updateSettings({ enabled: false });
      return;
    }
    const granted = await requestReminderPermission();
    setDenied(!granted);
    await updateSettings({ enabled: granted });
  };

  return (
    <Card>
      <ThemedText type="smallBold">Reminders</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Get a local notification when tasks are due.
      </ThemedText>

      <Toggle
        label="Enable task reminders"
        value={settings.enabled}
        onChange={onToggleEnabled}
      />

      {denied ? (
        <ThemedText type="small" themeColor="textSecondary">
          Notifications are turned off for HomeOps. Enable them in your device
          settings to receive reminders.
        </ThemedText>
      ) : null}

      {settings.enabled ? (
        <View style={styles.leadTimes}>
          <TimeOfDayPicker
            label="Time"
            hour={settings.hour}
            minute={settings.minute}
            onChange={(hour, minute) => updateSettings({ hour, minute })}
          />
          <ThemedText type="smallBold" themeColor="textSecondary">
            Remind me
          </ThemedText>
          {LEAD_TIME_OPTIONS.map((option) => (
            <Toggle
              key={option.days}
              label={option.label}
              value={settings.leadDays.includes(option.days)}
              onChange={() => toggleLeadDay(option.days)}
            />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  leadTimes: { gap: Spacing.two, paddingTop: Spacing.one },
});
