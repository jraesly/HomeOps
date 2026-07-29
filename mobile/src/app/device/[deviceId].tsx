import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDevice, useDeviceLogs, useDeviceTasks } from '@/api/hooks';
import type { Device } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { QrLabel } from '@/components/qr-label';
import { TaskCard } from '@/components/task-card';
import { AddButton } from '@/components/ui/add-button';
import { Card, CardRow } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { Screen } from '@/components/ui/screen';
import { EmptyView } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { formatCost, formatDate, humanize } from '@/utils/format';

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
  const router = useRouter();
  const [section, setSection] = useState<Section>('Overview');
  const tasksQuery = useDeviceTasks(device.id);
  const logsQuery = useDeviceLogs(device.id);

  const tasks = tasksQuery.data ?? [];
  const logs = logsQuery.data ?? [];

  // The header "+" adapts to the visible section.
  const addAction =
    section === 'Tasks' ? (
      <AddButton
        onPress={() =>
          router.push(
            `/add-task?homeId=${device.home_id}&deviceId=${device.id}`,
          )
        }
        label="Add task"
      />
    ) : section === 'History' ? (
      <AddButton
        onPress={() =>
          router.push(
            `/add-log?homeId=${device.home_id}&deviceId=${device.id}`,
          )
        }
        label="Log maintenance"
      />
    ) : undefined;

  return (
    <>
      <Stack.Screen options={{ title: device.name }} />
      <Screen
        title={device.name}
        subtitle={device.device_type}
        action={addAction}>
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

        {section === 'Overview' ? (
          <Card>
            <ThemedText type="smallBold">QR code</ThemedText>
            <QrLabel deviceId={device.id} deviceName={device.name} />
          </Card>
        ) : null}

        {section === 'Tasks' ? (
          <View style={styles.section}>
            {tasks.length === 0 ? (
              <EmptyView message="No tasks for this device yet. Tap + to add one." />
            ) : (
              tasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </View>
        ) : null}

        {section === 'History' ? (
          <View style={styles.section}>
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

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  flexShrink: { flexShrink: 1 },
});
