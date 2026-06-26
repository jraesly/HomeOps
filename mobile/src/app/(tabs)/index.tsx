import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useCurrentHome, useDashboard } from '@/api/hooks';
import type { Dashboard, MaintenanceLog } from '@/api/types';
import { DeviceCard } from '@/components/device-card';
import { ThemedText } from '@/components/themed-text';
import { TaskCard } from '@/components/task-card';
import { Button } from '@/components/ui/button';
import { Card, CardRow } from '@/components/ui/card';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { EmptyView } from '@/components/ui/state-views';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { formatCost, formatDate } from '@/utils/format';

export default function DashboardScreen() {
  const homeQuery = useCurrentHome();
  const dashboardQuery = useDashboard(homeQuery.data?.id);

  return (
    <QueryBoundary
      title="HomeOps"
      query={dashboardQuery}
      gates={[homeQuery]}>
      {(data) => <DashboardContent data={data} />}
    </QueryBoundary>
  );
}

function DashboardContent({ data }: { data: Dashboard }) {
  const router = useRouter();
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

      <Card>
        <ThemedText type="smallBold">Quick Actions</ThemedText>
        <View style={styles.actions}>
          <Button
            label="Rooms & Devices"
            variant="secondary"
            onPress={() => router.push('/rooms')}
          />
          <Button
            label="All Tasks"
            variant="secondary"
            onPress={() => router.push('/tasks')}
          />
        </View>
      </Card>

      {data.needs_attention.length > 0 ? (
        <Section title="Needs Attention" emptyMessage="">
          {data.needs_attention.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </Section>
      ) : null}

      {data.low_stock.length > 0 ? (
        <Section title="Low Stock" emptyMessage="">
          {data.low_stock.map((consumable) => (
            <Card key={consumable.id}>
              <CardRow>
                <ThemedText type="smallBold" style={styles.flexShrink}>
                  {consumable.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {consumable.quantity_on_hand} left
                </ThemedText>
              </CardRow>
            </Card>
          ))}
        </Section>
      ) : null}

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
  actions: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
});
