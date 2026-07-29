import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useCreateDevice } from '@/api/hooks';
import { DEVICE_TYPES } from '@/api/enums';
import type { DeviceType, TaskCreate } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { DEVICE_TEMPLATES, type DeviceTemplate } from '@/data/device-templates';
import { useTheme } from '@/hooks/use-theme';
import { describeRecurrence, todayISO } from '@/utils/format';

const CUSTOM = 'custom';

/** Modal for adding a device to a room, opened from the room screen "+". */
export default function AddDeviceScreen() {
  const router = useRouter();
  const { homeId, roomId } = useLocalSearchParams<{
    homeId: string;
    roomId: string;
  }>();
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
      { onSuccess: () => router.back() },
    );
  };

  const templateOptions = [CUSTOM, ...DEVICE_TEMPLATES.map((t) => t.key)];
  const templateLabel = (key: string) =>
    key === CUSTOM
      ? 'Custom'
      : (DEVICE_TEMPLATES.find((t) => t.key === key)?.label ?? key);

  return (
    <>
      <Stack.Screen options={{ title: 'Add Device' }} />
      <Screen>
        <Card>
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
      </Screen>
    </>
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
  const theme = useTheme();
  return (
    <View style={styles.suggested}>
      <Pressable onPress={onToggle} style={styles.toggleRow}>
        <View
          style={[
            styles.checkbox,
            { borderColor: theme.accent },
            included && { backgroundColor: theme.accent },
          ]}>
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
  suggested: { gap: Spacing.one },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Spacing.one,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#ffffff', fontSize: 14, lineHeight: 18 },
  suggestedItem: { paddingLeft: Spacing.three },
});
