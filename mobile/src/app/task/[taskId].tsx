import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useCompleteTask, useTask } from '@/api/hooks';
import { Badge } from '@/components/badge';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card, CardRow } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ErrorView, LoadingView } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
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

const styles = StyleSheet.create({
  doneRow: { paddingVertical: Spacing.three, alignItems: 'center' },
  flagRow: { flexDirection: 'row', gap: Spacing.two, paddingTop: Spacing.one },
});
