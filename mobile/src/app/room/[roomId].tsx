import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  useCreateDevice,
  useDevices,
  useHomeTasks,
  useRoom,
} from '@/api/hooks';
import type { DeviceType, TaskCreate } from '@/api/types';
import { DeviceCard } from '@/components/device-card';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { DEVICE_TEMPLATES, type DeviceTemplate } from '@/data/device-templates';
import { describeRecurrence, todayISO } from '@/utils/format';
import { nextDueTask } from '@/utils/tasks';

const DEVICE_TYPES: readonly DeviceType[] = [
  'HVAC',
  'Water Treatment',
  'Appliance',
  'Plumbing',
  'Electrical',
  'Exterior',
  'Garden',
  'Safety',
  'Network',
  'Other',
];

const CUSTOM = 'custom';

export default function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const roomQuery = useRoom(roomId);
  const room = roomQuery.data;
  const devicesQuery = useDevices(room?.home_id);
  const tasksQuery = useHomeTasks(room?.home_id);

  if (roomQuery.isLoading) {
    return (
      <Screen title="Room">
        <LoadingView />
      </Screen>
    );
  }
  if (roomQuery.error || !room) {
    return (
      <Screen title="Room">
        <ErrorView error={roomQuery.error ?? new Error('Room not found')} />
      </Screen>
    );
  }

  const devices = (devicesQuery.data ?? []).filter((d) => d.room_id === room.id);
  const tasks = tasksQuery.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: room.name }} />
      <Screen title={room.name} subtitle={room.room_type ?? undefined}>
        <AddDevice homeId={room.home_id} roomId={room.id} />
        <View style={styles.list}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            DEVICES
          </ThemedText>
          {devices.length === 0 ? (
            <EmptyView message="No devices in this room yet." />
          ) : (
            devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                nextTask={nextDueTask(tasks, device.id)}
              />
            ))
          )}
        </View>
      </Screen>
    </>
  );
}

function AddDevice({ homeId, roomId }: { homeId: string; roomId: string }) {
  const [templateKey, setTemplateKey] = useState<string>(CUSTOM);
  const [name, setName] = useState('');
  const [type, setType] = useState<DeviceType>('Other');
  const [includeTasks, setIncludeTasks] = useState(true);
  const createDevice = useCreateDevice(homeId, roomId);

  const template = DEVICE_TEMPLATES.find((t) => t.key === templateKey) ?? null;

  const applyTemplate = (key: string) => {
    setTemplateKey(key);
    const found = DEVICE_TEMPLATES.find((t) => t.key === key);
    if (found) {
      setName(found.defaultName);
      setType(found.device_type);
      setIncludeTasks(true);
    }
  };

  const reset = () => {
    setTemplateKey(CUSTOM);
    setName('');
    setType('Other');
    setIncludeTasks(true);
  };

  const onSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const tasks: TaskCreate[] =
      template && includeTasks
        ? template.suggestedTasks.map((task) => ({
            ...task,
            due_date: todayISO(),
          }))
        : [];

    createDevice.mutate(
      { device: { name: trimmed, device_type: type }, tasks },
      { onSuccess: reset },
    );
  };

  const templateOptions = [CUSTOM, ...DEVICE_TEMPLATES.map((t) => t.key)];
  const templateLabel = (key: string) =>
    key === CUSTOM
      ? 'Custom'
      : (DEVICE_TEMPLATES.find((t) => t.key === key)?.label ?? key);

  return (
    <Card>
      <ThemedText type="smallBold">Add a device</ThemedText>

      <ThemedText type="smallBold" themeColor="textSecondary">
        Start from a template
      </ThemedText>
      <Chips
        options={templateOptions}
        value={templateKey}
        onChange={applyTemplate}
        labelFor={templateLabel}
      />

      <TextField
        label="Device name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Whole-House Filter"
      />

      <ThemedText type="smallBold" themeColor="textSecondary">
        Type
      </ThemedText>
      <Chips options={DEVICE_TYPES} value={type} onChange={setType} />

      {template ? (
        <SuggestedTasks
          template={template}
          included={includeTasks}
          onToggle={() => setIncludeTasks((value) => !value)}
        />
      ) : null}

      <Button
        label="Add Device"
        onPress={onSubmit}
        loading={createDevice.isPending}
        disabled={!name.trim()}
      />
    </Card>
  );
}

function SuggestedTasks({
  template,
  included,
  onToggle,
}: {
  template: DeviceTemplate;
  included: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.suggested}>
      <Pressable onPress={onToggle} style={styles.toggleRow}>
        <View style={[styles.checkbox, included && styles.checkboxOn]}>
          {included ? <ThemedText style={styles.check}>✓</ThemedText> : null}
        </View>
        <ThemedText type="small">
          Add {template.suggestedTasks.length} suggested task
          {template.suggestedTasks.length === 1 ? '' : 's'}
        </ThemedText>
      </Pressable>
      {included
        ? template.suggestedTasks.map((task) => (
            <ThemedText
              key={task.title}
              type="small"
              themeColor="textSecondary"
              style={styles.suggestedItem}>
              • {task.title} ·{' '}
              {describeRecurrence(task.recurrence_type, task.recurrence_interval)}
            </ThemedText>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  suggested: { gap: Spacing.one },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#208AEF' },
  check: { color: '#ffffff', fontSize: 14, lineHeight: 18 },
  suggestedItem: { paddingLeft: Spacing.three },
});
