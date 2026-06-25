import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/badge';
import { ThemedText } from '@/components/themed-text';
import { Card, CardRow } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import type { Task } from '@/api/types';
import { describeDue, humanize, priorityColor } from '@/utils/format';

/** A tappable task summary row used on the dashboard, task list, and device. */
export function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const overdue =
    !!task.due_date && new Date(`${task.due_date}T00:00:00`) < startOfToday();

  return (
    <Card onPress={() => router.push(`/task/${task.id}`)}>
      <CardRow>
        <ThemedText type="smallBold" style={styles.title}>
          {task.title}
        </ThemedText>
        <Badge label={humanize(task.priority)} color={priorityColor[task.priority]} />
      </CardRow>
      <View style={styles.metaRow}>
        <ThemedText
          type="small"
          themeColor={overdue ? undefined : 'textSecondary'}
          style={overdue ? styles.overdue : undefined}>
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
  overdue: { color: '#DC2626' },
});
