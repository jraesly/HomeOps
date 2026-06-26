import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useCurrentHome, useSearch, useTimeline } from '@/api/hooks';
import type { HomeEvent, SearchResults } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Card, CardRow } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { EmptyView, LoadingView } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { formatDate, humanize } from '@/utils/format';

export default function ActivityScreen() {
  const homeQuery = useCurrentHome();
  const homeId = homeQuery.data?.id;
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;

  const timelineQuery = useTimeline(searching ? undefined : homeId);
  const searchQuery = useSearch(homeId, query);

  return (
    <Screen title="Activity">
      <TextField
        label="Search"
        value={query}
        onChangeText={setQuery}
        placeholder="rooms, devices, tasks, logs, parts…"
      />
      {searching ? (
        <SearchView
          loading={searchQuery.isLoading}
          results={searchQuery.data}
        />
      ) : (
        <TimelineView
          loading={timelineQuery.isLoading || homeQuery.isLoading}
          events={timelineQuery.data ?? []}
        />
      )}
    </Screen>
  );
}

function TimelineView({
  loading,
  events,
}: {
  loading: boolean;
  events: HomeEvent[];
}) {
  const router = useRouter();
  if (loading) return <LoadingView />;
  if (events.length === 0) {
    return <EmptyView message="No activity yet. Add devices and complete tasks to build your home's history." />;
  }
  return (
    <View style={styles.list}>
      {events.map((event) => (
        <Card
          key={event.id}
          onPress={
            event.device_id
              ? () => router.push(`/device/${event.device_id}`)
              : undefined
          }>
          <CardRow>
            <ThemedText type="smallBold" style={styles.flexShrink}>
              {event.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatDate(event.occurred_at)}
            </ThemedText>
          </CardRow>
          <ThemedText type="small" themeColor="textSecondary">
            {humanize(event.event_type)}
          </ThemedText>
        </Card>
      ))}
    </View>
  );
}

function SearchView({
  loading,
  results,
}: {
  loading: boolean;
  results: SearchResults | undefined;
}) {
  const router = useRouter();
  if (loading) return <LoadingView />;
  if (!results) return null;

  const total =
    results.rooms.length +
    results.devices.length +
    results.tasks.length +
    results.logs.length +
    results.consumables.length;

  if (total === 0) {
    return <EmptyView message={`No matches for "${results.query}".`} />;
  }

  return (
    <View style={styles.list}>
      <ResultGroup title="Rooms">
        {results.rooms.map((room) => (
          <ResultRow
            key={room.id}
            label={room.name}
            onPress={() => router.push(`/room/${room.id}`)}
          />
        ))}
      </ResultGroup>
      <ResultGroup title="Devices">
        {results.devices.map((device) => (
          <ResultRow
            key={device.id}
            label={device.name}
            sub={device.device_type}
            onPress={() => router.push(`/device/${device.id}`)}
          />
        ))}
      </ResultGroup>
      <ResultGroup title="Tasks">
        {results.tasks.map((task) => (
          <ResultRow
            key={task.id}
            label={task.title}
            onPress={() => router.push(`/task/${task.id}`)}
          />
        ))}
      </ResultGroup>
      <ResultGroup title="Logs">
        {results.logs.map((log) => (
          <ResultRow
            key={log.id}
            label={log.title}
            sub={formatDate(log.completed_at)}
            onPress={
              log.device_id
                ? () => router.push(`/device/${log.device_id}`)
                : undefined
            }
          />
        ))}
      </ResultGroup>
      <ResultGroup title="Inventory">
        {results.consumables.map((consumable) => (
          <ResultRow
            key={consumable.id}
            label={consumable.name}
            sub={`${consumable.quantity_on_hand} on hand`}
          />
        ))}
      </ResultGroup>
    </View>
  );
}

function ResultGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode[];
}) {
  if (children.length === 0) return null;
  return (
    <View style={styles.group}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title.toUpperCase()}
      </ThemedText>
      {children}
    </View>
  );
}

function ResultRow({
  label,
  sub,
  onPress,
}: {
  label: string;
  sub?: string;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress}>
      <CardRow>
        <ThemedText type="smallBold" style={styles.flexShrink}>
          {label}
        </ThemedText>
        {sub ? (
          <ThemedText type="small" themeColor="textSecondary">
            {sub}
          </ThemedText>
        ) : null}
      </CardRow>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  group: { gap: Spacing.two },
  flexShrink: { flexShrink: 1 },
});
