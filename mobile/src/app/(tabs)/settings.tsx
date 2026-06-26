import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { API_BASE_URL } from '@/api/config';
import { useCreateHome, useCurrentHome, useHomes } from '@/api/hooks';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardRow } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { TimeOfDayPicker } from '@/components/ui/time-picker';
import { Toggle } from '@/components/ui/toggle';
import { Spacing } from '@/constants/theme';
import { setSelectedHomeId } from '@/homes/selected-home';
import { requestReminderPermission } from '@/reminders/scheduler';
import {
  LEAD_TIME_OPTIONS,
  toggleLeadDay,
  updateSettings,
  useReminderSettings,
} from '@/reminders/settings';

export default function SettingsScreen() {
  return (
    <Screen title="Settings">
      <Homes />
      <Reminders />

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

function Homes() {
  const homesQuery = useHomes();
  const currentQuery = useCurrentHome();
  const createHome = useCreateHome();
  const [name, setName] = useState('');

  const homes = homesQuery.data ?? [];
  const currentId = currentQuery.data?.id;

  const onAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createHome.mutate(
      { name: trimmed },
      {
        onSuccess: (home) => {
          setName('');
          void setSelectedHomeId(home.id);
        },
      },
    );
  };

  return (
    <Card>
      <ThemedText type="smallBold">Homes</ThemedText>
      {homes.map((home) => {
        const selected = home.id === currentId;
        return (
          <Pressable
            key={home.id}
            onPress={() => setSelectedHomeId(home.id)}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView
              type={selected ? 'backgroundSelected' : 'backgroundElement'}
              style={styles.homeRow}>
              <ThemedText type="small">{home.name}</ThemedText>
              {selected ? (
                <ThemedText type="smallBold" themeColor="textSecondary">
                  ✓ Current
                </ThemedText>
              ) : null}
            </ThemedView>
          </Pressable>
        );
      })}
      <TextField
        label="Add a home"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Lake Cabin"
      />
      <Button
        label="Add Home"
        variant="secondary"
        onPress={onAdd}
        loading={createHome.isPending}
        disabled={!name.trim()}
      />
    </Card>
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
  homeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  pressed: { opacity: 0.7 },
});
