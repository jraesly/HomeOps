import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  useCompleteTask,
  useConsumables,
  useCurrentHome,
  useLinkTaskConsumable,
  useTask,
  useTaskConsumables,
  useUnlinkTaskConsumable,
} from '@/api/hooks';
import { Badge } from '@/components/badge';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card, CardRow } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Toggle } from '@/components/ui/toggle';
import { Spacing } from '@/constants/theme';
import {
  describeDue,
  describeRecurrence,
  humanize,
  priorityColor,
} from '@/utils/format';

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  const taskQuery = useTask(taskId);
  const task = taskQuery.data;
  const completeTask = useCompleteTask(task?.home_id ?? '');

  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [deductInventory, setDeductInventory] = useState(true);

  if (taskQuery.isLoading) {
    return (
      <Screen title="Task">
        <LoadingView />
      </Screen>
    );
  }
  if (taskQuery.error || !task) {
    return (
      <Screen title="Task">
        <ErrorView error={taskQuery.error ?? new Error('Task not found')} />
      </Screen>
    );
  }

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
});
