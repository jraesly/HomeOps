import { StyleSheet, View } from 'react-native';

import { useCurrentHome, useDashboard } from '@/api/hooks';
import type { MaintenanceLog } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { TaskCard } from '@/components/task-card';
import { Card, CardRow } from '@/components/ui/card';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-views';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { formatCost, formatDate } from '@/utils/format';

export default function DashboardScreen() {
  const homeQuery = useCurrentHome();
  const home = homeQuery.data;
  const dashboardQuery = useDashboard(home?.id);

  if (homeQuery.isLoading || dashboardQuery.isLoading) {
    return (
      <Screen title="HomeOps">
        <LoadingView />
      </Screen>
    );
  }

  const error = homeQuery.error ?? dashboardQuery.error;
  if (error || !dashboardQuery.data) {
    return (
      <Screen title="HomeOps">
        <ErrorView error={error ?? new Error('No dashboard data')} />
      </Screen>
    );
  }

  const data = dashboardQuery.data;

  return (
    <Screen title={data.home_name}>
      <Card>
        <CardRow>
          <ThemedText type="smallBold">Home Health</ThemedText>
          <ThemedText type="subtitle">{data.home_health_score}%</ThemedText>
        </CardRow>
        <ThemedText type="small" themeColor="textSecondary">
          {data.counts.overdue} overdue · {data.counts.due_soon} due soon ·{' '}
          {data.counts.upcoming} upcoming
        </ThemedText>
      </Card>

      <Section title="Overdue" emptyMessage="Nothing overdue. 🎉">
        {data.overdue.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </Section>

      <Section title="Due Soon" emptyMessage="Nothing due in the next two weeks.">
        {data.due_soon.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </Section>

      <Section title="Upcoming" emptyMessage="No upcoming tasks.">
        {data.upcoming.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </Section>

      <Section
        title="Recently Completed"
        emptyMessage="No completed maintenance yet.">
        {data.recently_completed.map((log) => (
          <CompletedLogRow key={log.id} log={log} />
        ))}
      </Section>
    </Screen>
  );
}

function Section({
  title,
  emptyMessage,
  children,
}: {
  title: string;
  emptyMessage: string;
  children: React.ReactNode[];
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title.toUpperCase()}
      </ThemedText>
      {children.length > 0 ? children : <EmptyView message={emptyMessage} />}
    </View>
  );
}

function CompletedLogRow({ log }: { log: MaintenanceLog }) {
  return (
    <Card>
      <CardRow>
        <ThemedText type="smallBold" style={styles.flexShrink}>
          {log.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDate(log.completed_at)}
        </ThemedText>
      </CardRow>
      {log.cost_cents != null ? (
        <ThemedText type="small" themeColor="textSecondary">
          {formatCost(log.cost_cents)}
        </ThemedText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  flexShrink: { flexShrink: 1 },
});
