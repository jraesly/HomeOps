import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  useCompleteTask,
  useConsumables,
  useCurrentHome,
  useDeleteTask,
  useLinkTaskConsumable,
  useTask,
  useTaskConsumables,
  useUnlinkTaskConsumable,
  useUpdateTask,
} from '@/api/hooks';
import { PRIORITIES, RECURRENCE_OPTIONS } from '@/api/enums';
import type { Priority, RecurrenceType, Task } from '@/api/types';
import { Badge } from '@/components/badge';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card, CardRow } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { Collapsible } from '@/components/ui/collapsible';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { Screen } from '@/components/ui/screen';
import { EmptyView } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Toggle } from '@/components/ui/toggle';
import { Spacing } from '@/constants/theme';
import {
  LEAD_TIME_OPTIONS,
  useReminderSettings,
} from '@/reminders/settings';
import {
  setTaskOverride,
  useTaskOverride,
} from '@/reminders/task-overrides';
import {
  describeDue,
  describeRecurrence,
  humanize,
  priorityColor,
} from '@/utils/format';

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const taskQuery = useTask(taskId);
  return (
    <QueryBoundary query={taskQuery} title="Task">
      {(task) => <TaskDetailContent task={task} />}
    </QueryBoundary>
  );
}

function TaskDetailContent({ task }: { task: Task }) {
  const router = useRouter();
  const completeTask = useCompleteTask(task.home_id);
  const deleteTask = useDeleteTask(task.home_id, task.device_id);

  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [deductInventory, setDeductInventory] = useState(true);

  const isActive = task.status === 'active' || task.status === 'completed_once';

  const onComplete = () => {
    const dollars = parseFloat(cost);
    const cost_cents = Number.isFinite(dollars) ? Math.round(dollars * 100) : null;
    // Treat a bare YYYY-MM-DD as midnight UTC so the backend records that day.
    const completed_at = completedDate.trim()
      ? `${completedDate.trim()}T00:00:00Z`
      : null;
    completeTask.mutate(
      {
        taskId: task.id,
        payload: {
          notes: notes.trim() || null,
          cost_cents,
          performed_by: performedBy.trim() || null,
          completed_at,
          deduct_inventory: deductInventory,
        },
      },
      { onSuccess: () => router.back() },
    );
  };

  const onDelete = () => {
    Alert.alert(
      'Delete task?',
      `"${task.title}" will be permanently removed. Its past logs are kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteTask.mutate(task.id, { onSuccess: () => router.back() }),
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: task.title }} />
      <Screen title={task.title}>
        <Card>
          <CardRow>
            <ThemedText type="smallBold">Priority</ThemedText>
            <Badge label={humanize(task.priority)} color={priorityColor[task.priority]} />
          </CardRow>
          <MetaRow label="Status" value={humanize(task.status)} />
          <MetaRow label="Due" value={describeDue(task.due_date)} />
          <MetaRow
            label="Recurrence"
            value={describeRecurrence(task.recurrence_type, task.recurrence_interval)}
          />
          {task.estimated_minutes != null ? (
            <MetaRow label="Estimate" value={`${task.estimated_minutes} min`} />
          ) : null}
          {task.requires_parts || task.contractor_required ? (
            <View style={styles.flagRow}>
              {task.requires_parts ? (
                <Badge label="Parts needed" color="#7C3AED" />
              ) : null}
              {task.contractor_required ? (
                <Badge label="Contractor" color="#0891B2" />
              ) : null}
            </View>
          ) : null}
        </Card>

        {task.instructions ? (
          <Card>
            <ThemedText type="smallBold">Instructions</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {task.instructions}
            </ThemedText>
          </Card>
        ) : null}

        <Card>
          <TaskEdit task={task} />
        </Card>

        <Card>
          <TaskReminders taskId={task.id} />
        </Card>

        <TaskParts taskId={task.id} homeId={task.home_id} />

        {isActive ? (
          <Card>
            <ThemedText type="smallBold">Complete this task</ThemedText>
            <TextField
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="What was done?"
            />
            <TextField
              label="Cost (optional)"
              value={cost}
              onChangeText={setCost}
              keyboardType="numeric"
              placeholder="18.00"
            />
            <TextField
              label="Performed by (optional)"
              value={performedBy}
              onChangeText={setPerformedBy}
              placeholder="e.g. John"
            />
            <TextField
              label="Completed date (YYYY-MM-DD, optional)"
              value={completedDate}
              onChangeText={setCompletedDate}
              placeholder="Defaults to today"
            />
            <Toggle
              label="Deduct linked parts from inventory"
              value={deductInventory}
              onChange={setDeductInventory}
            />
            <Button
              label="Complete Task"
              onPress={onComplete}
              loading={completeTask.isPending}
            />
          </Card>
        ) : (
          <View style={styles.doneRow}>
            <ThemedText themeColor="textSecondary">
              This task is {humanize(task.status).toLowerCase()}.
            </ThemedText>
          </View>
        )}

        <Button
          label="Delete Task"
          variant="secondary"
          onPress={onDelete}
          loading={deleteTask.isPending}
        />
      </Screen>
    </>
  );
}

function TaskEdit({ task }: { task: Task }) {
  const update = useUpdateTask(task.home_id, task.device_id);
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(
    task.recurrence_type,
  );
  const [interval, setInterval] = useState(String(task.recurrence_interval));
  const [dueDate, setDueDate] = useState(task.due_date ?? '');

  const onSave = () => {
    update.mutate({
      taskId: task.id,
      payload: {
        title: title.trim() || task.title,
        priority,
        recurrence_type: recurrence,
        recurrence_interval: Math.max(1, parseInt(interval, 10) || 1),
        due_date: dueDate.trim() ? dueDate.trim() : null,
      },
    });
  };

  return (
    <Collapsible title="Edit task">
      <View style={styles.editForm}>
        <TextField label="Title" value={title} onChangeText={setTitle} />
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
          />
        ) : null}
        <TextField
          label="Due date (YYYY-MM-DD, optional)"
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="2026-07-01"
        />
        <Button
          label="Save Changes"
          onPress={onSave}
          loading={update.isPending}
        />
      </View>
    </Collapsible>
  );
}

function TaskReminders({ taskId }: { taskId: string }) {
  const settings = useReminderSettings();
  const override = useTaskOverride(taskId);

  if (!settings.enabled) {
    return (
      <>
        <ThemedText type="smallBold">Reminders</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Reminders are off. Turn them on in Settings to be notified about this
          task.
        </ThemedText>
      </>
    );
  }

  const muted = override.muted === true;
  const custom = override.leadDays !== undefined;
  const leadDays = override.leadDays ?? settings.leadDays;

  const toggleLead = (days: number) => {
    const has = leadDays.includes(days);
    const next = has
      ? leadDays.filter((d) => d !== days)
      : [...leadDays, days].sort((a, b) => a - b);
    void setTaskOverride(taskId, { leadDays: next });
  };

  return (
    <>
      <ThemedText type="smallBold">Reminders</ThemedText>
      <Toggle
        label="Remind me about this task"
        value={!muted}
        onChange={(on) => setTaskOverride(taskId, { muted: !on })}
      />
      {!muted ? (
        <>
          <Toggle
            label="Use custom times for this task"
            value={custom}
            onChange={(on) =>
              setTaskOverride(taskId, {
                leadDays: on ? settings.leadDays : undefined,
              })
            }
          />
          {custom ? (
            <View style={styles.taskLeadTimes}>
              {LEAD_TIME_OPTIONS.map((option) => (
                <Toggle
                  key={option.days}
                  label={option.label}
                  value={leadDays.includes(option.days)}
                  onChange={() => toggleLead(option.days)}
                />
              ))}
            </View>
          ) : null}
        </>
      ) : null}
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

function TaskParts({ taskId, homeId }: { taskId: string; homeId: string }) {
  const linksQuery = useTaskConsumables(taskId);
  const homeQuery = useCurrentHome();
  const consumablesQuery = useConsumables(homeQuery.data?.id ?? homeId);
  const link = useLinkTaskConsumable(taskId);
  const unlink = useUnlinkTaskConsumable(taskId);

  const [selected, setSelected] = useState<string>('');
  const [quantity, setQuantity] = useState('1');

  const links = linksQuery.data ?? [];
  const consumables = consumablesQuery.data ?? [];
  const linkedIds = new Set(links.map((l) => l.consumable_id));
  const available = consumables.filter((c) => !linkedIds.has(c.id));

  const onAdd = () => {
    const consumableId = selected || available[0]?.id;
    if (!consumableId) return;
    link.mutate(
      {
        consumable_id: consumableId,
        quantity_required: Math.max(1, parseInt(quantity, 10) || 1),
      },
      {
        onSuccess: () => {
          setSelected('');
          setQuantity('1');
        },
      },
    );
  };

  return (
    <Card>
      <ThemedText type="smallBold">Parts</ThemedText>
      {links.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No parts linked. Linked parts are deducted from inventory on
          completion.
        </ThemedText>
      ) : (
        links.map((l) => (
          <CardRow key={l.id}>
            <ThemedText type="small" style={styles.flexShrink}>
              {l.consumable.name} × {l.quantity_required}
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              onPress={() => unlink.mutate(l.id)}>
              Remove
            </ThemedText>
          </CardRow>
        ))
      )}

      {available.length > 0 ? (
        <View style={styles.addPart}>
          <Chips
            options={available.map((c) => c.id)}
            value={selected || available[0].id}
            onChange={setSelected}
            labelFor={(id) =>
              available.find((c) => c.id === id)?.name ?? id
            }
          />
          <TextField
            label="Quantity required"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
          <Button
            label="Link Part"
            variant="secondary"
            onPress={onAdd}
            loading={link.isPending}
          />
        </View>
      ) : consumables.length === 0 ? (
        <EmptyView message="Add consumables in the Inventory tab to link them." />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  doneRow: { paddingVertical: Spacing.three, alignItems: 'center' },
  flagRow: { flexDirection: 'row', gap: Spacing.two, paddingTop: Spacing.one },
  flexShrink: { flexShrink: 1 },
  addPart: { gap: Spacing.two, paddingTop: Spacing.one },
  editForm: { gap: Spacing.two },
  taskLeadTimes: { gap: Spacing.two, paddingTop: Spacing.one },
});
