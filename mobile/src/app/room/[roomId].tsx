import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAreas, useDevices, useRoom, useUpdateRoom } from '@/api/hooks';
import type { Room } from '@/api/types';
import { DeviceCard } from '@/components/device-card';
import { ThemedText } from '@/components/themed-text';
import { AddButton } from '@/components/ui/add-button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { Screen } from '@/components/ui/screen';
import { EmptyView } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';

const NO_AREA = '';

export default function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const roomQuery = useRoom(roomId);
  return (
    <QueryBoundary query={roomQuery} title="Room">
      {(room) => <RoomDetailContent room={room} />}
    </QueryBoundary>
  );
}

function RoomDetailContent({ room }: { room: Room }) {
  const router = useRouter();
  const devicesQuery = useDevices(room.home_id);
  const devices = (devicesQuery.data ?? []).filter((d) => d.room_id === room.id);

  return (
    <>
      <Stack.Screen options={{ title: room.name }} />
      <Screen
        title={room.name}
        subtitle={room.room_type ?? undefined}
        action={
          <AddButton
            onPress={() =>
              router.push(
                `/add-device?homeId=${room.home_id}&roomId=${room.id}`,
              )
            }
            label="Add device"
          />
        }>
        <RoomAreaEditor homeId={room.home_id} room={room} />
        <View style={styles.list}>
          <ThemedText type="smallBold" themeColor="accent">
            DEVICES
          </ThemedText>
          {devices.length === 0 ? (
            <EmptyView message="No devices in this room yet. Tap + to add one." />
          ) : (
            devices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))
          )}
        </View>
      </Screen>
    </>
  );
}

function RoomAreaEditor({ homeId, room }: { homeId: string; room: Room }) {
  const areasQuery = useAreas(homeId);
  const updateRoom = useUpdateRoom(homeId, room.id);

  const areas = [...(areasQuery.data ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  );
  if (areas.length === 0) return null;

  const options = [NO_AREA, ...areas.map((a) => a.id)];
  const labelFor = (id: string) =>
    id === NO_AREA ? 'No area' : (areas.find((a) => a.id === id)?.name ?? id);

  return (
    <Card>
      <ThemedText type="smallBold">Area / floor</ThemedText>
      <Chips
        options={options}
        value={room.area_id ?? NO_AREA}
        onChange={(id) =>
          updateRoom.mutate({ area_id: id === NO_AREA ? null : id })
        }
        labelFor={labelFor}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
});
