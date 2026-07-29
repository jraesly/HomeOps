import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { useCreateTask } from '@/api/hooks';
import { PRIORITIES, RECURRENCE_OPTIONS, TASK_TYPES } from '@/api/enums';
import type { Priority, RecurrenceType, TaskType } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { DateField } from '@/components/ui/date-field';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Toggle } from '@/components/ui/toggle';
import { describeRecurrence, humanize } from '@/utils/format';

/** Modal for adding a task to a device, opened from the device screen "+". */
export default function AddTaskScreen() {
  const router = useRouter();
  const { homeId, deviceId } = useLocalSearchParams<{
    homeId: string;
    deviceId: string;
  }>();
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
      { onSuccess: () => router.back() },
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Add Task' }} />
      <Screen>
        <Card>
          <TextField
            label="Task title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Replace sediment filter"
            autoFocus
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

          <DateField
            label="Due date (optional)"
            value={dueDate}
            onChange={setDueDate}
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
      </Screen>
    </>
  );
}
