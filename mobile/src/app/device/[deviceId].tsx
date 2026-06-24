import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  useCreateTask,
  useDevice,
  useDeviceLogs,
  useDeviceTasks,
} from '@/api/hooks';
import type { RecurrenceType } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { TaskCard } from '@/components/task-card';
import { Button } from '@/components/ui/button';
import { Card, CardRow } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { describeRecurrence, formatCost, formatDate, humanize } from '@/utils/format';

const RECURRENCE_OPTIONS: readonly RecurrenceType[] = [
  'none',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom_days',
];

export default function DeviceDetailScreen() {
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();
  const deviceQuery = useDevice(deviceId);
  const tasksQuery = useDeviceTasks(deviceId);
  const logsQuery = useDeviceLogs(deviceId);
  const device = deviceQuery.data;

  if (deviceQuery.isLoading) {
    return (
      <Screen title="Device">
        <LoadingView />
      </Screen>
    );
  }
  if (deviceQuery.error || !device) {
    return (
      <Screen title="Device">
        <ErrorView error={deviceQuery.error ?? new Error('Device not found')} />
      </Screen>
    );
  }

  const tasks = tasksQuery.data ?? [];
  const logs = logsQuery.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: device.name }} />
      <Screen title={device.name} subtitle={device.device_type}>
        <Card>
          <MetaRow label="Status" value={humanize(device.status)} />
          {device.manufacturer ? (
            <MetaRow label="Manufacturer" value={device.manufacturer} />
          ) : null}
          {device.model_number ? (
            <MetaRow label="Model" value={device.model_number} />
          ) : null}
          {device.serial_number ? (
            <MetaRow label="Serial" value={device.serial_number} />
          ) : null}
        </Card>

        <AddTask homeId={device.home_id} deviceId={device.id} />

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            TASKS
          </ThemedText>
          {tasks.length === 0 ? (
            <EmptyView message="No tasks for this device yet." />
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            HISTORY
          </ThemedText>
          {logs.length === 0 ? (
            <EmptyView message="No maintenance history yet." />
          ) : (
            logs.map((log) => (
              <Card key={log.id}>
                <CardRow>
                  <ThemedText type="smallBold" style={styles.flexShrink}>
                    {log.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatDate(log.completed_at)}
                  </ThemedText>
                </CardRow>
                {log.notes ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {log.notes}
                  </ThemedText>
                ) : null}
                {log.cost_cents != null ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatCost(log.cost_cents)}
                  </ThemedText>
                ) : null}
              </Card>
            ))
          )}
        </View>
      </Screen>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <CardRow>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{value}</ThemedText>
    </CardRow>
  );
}

function AddTask({ homeId, deviceId }: { homeId: string; deviceId: string }) {
  const [title, setTitle] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('monthly');
  const [interval, setInterval] = useState('1');
  const [dueDate, setDueDate] = useState('');
  const createTask = useCreateTask(homeId, deviceId);

  const onSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const parsedInterval = Math.max(1, parseInt(interval, 10) || 1);
    createTask.mutate(
      {
        title: trimmed,
        recurrence_type: recurrence,
        recurrence_interval: parsedInterval,
        due_date: dueDate.trim() ? dueDate.trim() : null,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDueDate('');
        },
      },
    );
  };

  return (
    <Card>
      <ThemedText type="smallBold">Add a task</ThemedText>
      <TextField
        label="Task title"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Replace sediment filter"
      />
      <ThemedText type="smallBold" themeColor="textSecondary">
        Recurrence
      </ThemedText>
      <Chips
        options={RECURRENCE_OPTIONS}
        value={recurrence}
        onChange={setRecurrence}
        labelFor={(value) => describeRecurrence(value, 1)}
      />
      {recurrence !== 'none' ? (
        <TextField
          label="Interval"
          value={interval}
          onChangeText={setInterval}
          keyboardType="numeric"
          placeholder="1"
        />
      ) : null}
      <TextField
        label="Due date (YYYY-MM-DD, optional)"
        value={dueDate}
        onChangeText={setDueDate}
        placeholder="2026-07-01"
      />
      <Button
        label="Add Task"
        onPress={onSubmit}
        loading={createTask.isPending}
        disabled={!title.trim()}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  flexShrink: { flexShrink: 1 },
});
