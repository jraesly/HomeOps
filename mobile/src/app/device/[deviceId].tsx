import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  useCreateLog,
  useCreateTask,
  useDevice,
  useDeviceLogs,
  useDeviceTasks,
} from '@/api/hooks';
import { PRIORITIES, RECURRENCE_OPTIONS, TASK_TYPES } from '@/api/enums';
import type { Device, Priority, RecurrenceType, TaskType } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { TaskCard } from '@/components/task-card';
import { Button } from '@/components/ui/button';
import { Card, CardRow } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { Screen } from '@/components/ui/screen';
import { EmptyView } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Toggle } from '@/components/ui/toggle';
import { Spacing } from '@/constants/theme';
import {
  describeRecurrence,
  formatCost,
  formatDate,
  humanize,
} from '@/utils/format';

const SECTIONS = ['Overview', 'Tasks', 'History'] as const;
type Section = (typeof SECTIONS)[number];

export default function DeviceDetailScreen() {
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();
  const deviceQuery = useDevice(deviceId);
  return (
    <QueryBoundary query={deviceQuery} title="Device">
      {(device) => <DeviceDetailContent device={device} />}
    </QueryBoundary>
  );
}

function DeviceDetailContent({ device }: { device: Device }) {
  const [section, setSection] = useState<Section>('Overview');
  const tasksQuery = useDeviceTasks(device.id);
  const logsQuery = useDeviceLogs(device.id);

  const tasks = tasksQuery.data ?? [];
  const logs = logsQuery.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: device.name }} />
      <Screen title={device.name} subtitle={device.device_type}>
        <Chips options={SECTIONS} value={section} onChange={setSection} />

        {section === 'Overview' ? (
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
            {device.install_date ? (
              <MetaRow label="Installed" value={formatDate(device.install_date)} />
            ) : null}
            {device.warranty_end_date ? (
              <MetaRow
                label="Warranty ends"
                value={formatDate(device.warranty_end_date)}
              />
            ) : null}
          </Card>
        ) : null}

        {section === 'Tasks' ? (
          <View style={styles.section}>
            <AddTask homeId={device.home_id} deviceId={device.id} />
            {tasks.length === 0 ? (
              <EmptyView message="No tasks for this device yet." />
            ) : (
              tasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </View>
        ) : null}

        {section === 'History' ? (
          <View style={styles.section}>
            <AddLog homeId={device.home_id} deviceId={device.id} />
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
                  {log.performed_by ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      By {log.performed_by}
                    </ThemedText>
                  ) : null}
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
        ) : null}
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
  const [taskType, setTaskType] = useState<TaskType>('other');
  const [priority, setPriority] = useState<Priority>('medium');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('monthly');
  const [interval, setInterval] = useState('1');
  const [dueDate, setDueDate] = useState('');
  const [estimate, setEstimate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [requiresParts, setRequiresParts] = useState(false);
  const [contractorRequired, setContractorRequired] = useState(false);
  const createTask = useCreateTask(homeId, deviceId);

  const reset = () => {
    setTitle('');
    setDueDate('');
    setEstimate('');
    setInstructions('');
    setRequiresParts(false);
    setContractorRequired(false);
  };

  const onSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const parsedInterval = Math.max(1, parseInt(interval, 10) || 1);
    const parsedEstimate = parseInt(estimate, 10);
    createTask.mutate(
      {
        title: trimmed,
        task_type: taskType,
        priority,
        recurrence_type: recurrence,
        recurrence_interval: parsedInterval,
        due_date: dueDate.trim() ? dueDate.trim() : null,
        estimated_minutes: Number.isFinite(parsedEstimate) ? parsedEstimate : null,
        instructions: instructions.trim() ? instructions.trim() : null,
        requires_parts: requiresParts,
        contractor_required: contractorRequired,
      },
      { onSuccess: reset },
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
        Type
      </ThemedText>
      <Chips
        options={TASK_TYPES}
        value={taskType}
        onChange={setTaskType}
        labelFor={humanize}
      />

      <ThemedText type="smallBold" themeColor="textSecondary">
        Priority
      </ThemedText>
      <Chips
        options={PRIORITIES}
        value={priority}
        onChange={setPriority}
        labelFor={humanize}
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
      <TextField
        label="Estimated minutes (optional)"
        value={estimate}
        onChangeText={setEstimate}
        keyboardType="numeric"
        placeholder="30"
      />
      <TextField
        label="Instructions (optional)"
        value={instructions}
        onChangeText={setInstructions}
        placeholder="How to perform this task"
      />

      <Toggle
        label="Requires parts"
        value={requiresParts}
        onChange={setRequiresParts}
      />
      <Toggle
        label="Contractor required"
        value={contractorRequired}
        onChange={setContractorRequired}
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

function AddLog({ homeId, deviceId }: { homeId: string; deviceId: string }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const createLog = useCreateLog(homeId, deviceId);

  const onSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const dollars = parseFloat(cost);
    createLog.mutate(
      {
        title: trimmed,
        notes: notes.trim() ? notes.trim() : null,
        cost_cents: Number.isFinite(dollars) ? Math.round(dollars * 100) : null,
        performed_by: performedBy.trim() ? performedBy.trim() : null,
      },
      {
        onSuccess: () => {
          setTitle('');
          setNotes('');
          setCost('');
          setPerformedBy('');
        },
      },
    );
  };

  return (
    <Card>
      <ThemedText type="smallBold">Log unplanned maintenance</ThemedText>
      <TextField
        label="What happened?"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. HVAC tech replaced capacitor"
      />
      <TextField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Details"
      />
      <TextField
        label="Cost (optional)"
        value={cost}
        onChangeText={setCost}
        keyboardType="numeric"
        placeholder="250.00"
      />
      <TextField
        label="Performed by (optional)"
        value={performedBy}
        onChangeText={setPerformedBy}
        placeholder="e.g. ACME HVAC"
      />
      <Button
        label="Add Log"
        onPress={onSubmit}
        variant="secondary"
        loading={createLog.isPending}
        disabled={!title.trim()}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  flexShrink: { flexShrink: 1 },
});
