import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/badge';
import { ThemedText } from '@/components/themed-text';
import { Card, CardRow } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Task } from '@/api/types';
import { describeDue, humanize, priorityColor } from '@/utils/format';

const DUE_SOON_DAYS = 14;

/** A tappable task summary row used on the dashboard, task list, and device. */
export function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const theme = useTheme();
  const overdue =
    !!task.due_date && new Date(`${task.due_date}T00:00:00`) < startOfToday();
  const context = [task.device_name, task.room_name]
    .filter(Boolean)
    .join(' · ');

  // Urgency stripe: red overdue, amber due soon, green scheduled out.
  let stripe: string | undefined;
  if (task.due_date) {
    const soonCutoff = startOfToday();
    soonCutoff.setDate(soonCutoff.getDate() + DUE_SOON_DAYS);
    stripe = overdue
      ? theme.danger
      : new Date(`${task.due_date}T00:00:00`) <= soonCutoff
        ? theme.warning
        : theme.success;
  }

  return (
    <Card onPress={() => router.push(`/task/${task.id}`)} accentColor={stripe}>
      <CardRow>
        <ThemedText type="smallBold" style={styles.title}>
          {task.title}
        </ThemedText>
        <Badge label={humanize(task.priority)} color={priorityColor[task.priority]} />
      </CardRow>
      {context ? (
        <ThemedText type="small" themeColor="textSecondary">
          {context}
        </ThemedText>
      ) : null}
      <View style={styles.metaRow}>
        <ThemedText
          type="small"
          themeColor={overdue ? undefined : 'textSecondary'}
          style={overdue ? { color: theme.danger } : undefined}>
          {describeDue(task.due_date)}
        </ThemedText>
      </View>
    </Card>
  );
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

const styles = StyleSheet.create({
  title: { flexShrink: 1 },
  metaRow: { flexDirection: 'row', gap: Spacing.two },
});
