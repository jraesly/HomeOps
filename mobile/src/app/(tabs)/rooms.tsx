import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  useAreas,
  useCreateArea,
  useCreateRoom,
  useCurrentHome,
  useRooms,
} from '@/api/hooks';
import type { Area, Home, Room } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card, CardRow } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { Screen } from '@/components/ui/screen';
import { EmptyView } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';

const NO_AREA = '';

export default function RoomsScreen() {
  const homeQuery = useCurrentHome();
  const home = homeQuery.data;
  const areasQuery = useAreas(home?.id);
  const roomsQuery = useRooms(home?.id);

  return (
    <QueryBoundary
      title="Rooms"
      query={roomsQuery}
      gates={[homeQuery, areasQuery]}>
      {(rooms) =>
        home ? (
          <RoomsContent
            home={home}
            rooms={rooms}
            areas={areasQuery.data ?? []}
          />
        ) : null
      }
    </QueryBoundary>
  );
}

function RoomsContent({
  home,
  rooms,
  areas: rawAreas,
}: {
  home: Home;
  rooms: Room[];
  areas: Area[];
}) {
  const areas = [...rawAreas].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  );
  const groups = buildGroups(areas, rooms);

  return (
    <Screen title="Rooms">
      <AddArea homeId={home.id} />
      <AddRoom homeId={home.id} areas={areas} />

      {rooms.length === 0 ? (
        <EmptyView message="No rooms yet. Add your first room above." />
      ) : (
        groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {group.title.toUpperCase()}
            </ThemedText>
            {group.rooms.map((room) => (
              <RoomRow key={room.id} room={room} />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

type RoomGroup = { key: string; title: string; rooms: Room[] };

function buildGroups(areas: Area[], rooms: Room[]): RoomGroup[] {
  const groups: RoomGroup[] = [];
  for (const area of areas) {
    const areaRooms = rooms.filter((room) => room.area_id === area.id);
    if (areaRooms.length > 0) {
      groups.push({ key: area.id, title: area.name, rooms: areaRooms });
    }
  }
  const unassigned = rooms.filter((room) => room.area_id == null);
  if (unassigned.length > 0) {
    groups.push({ key: 'unassigned', title: 'Unassigned', rooms: unassigned });
  }
  return groups;
}

function RoomRow({ room }: { room: Room }) {
  const router = useRouter();
  return (
    <Card onPress={() => router.push(`/room/${room.id}`)}>
      <CardRow>
        <ThemedText type="smallBold">{room.name}</ThemedText>
        {room.room_type ? (
          <ThemedText type="small" themeColor="textSecondary">
            {room.room_type}
          </ThemedText>
        ) : null}
      </CardRow>
    </Card>
  );
}

function AddArea({ homeId }: { homeId: string }) {
  const [name, setName] = useState('');
  const createArea = useCreateArea(homeId);

  const onSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createArea.mutate({ name: trimmed }, { onSuccess: () => setName('') });
  };

  return (
    <Card>
      <ThemedText type="smallBold">Add an area / floor</ThemedText>
      <TextField
        label="Area name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Main Floor"
      />
      <Button
        label="Add Area"
        onPress={onSubmit}
        variant="secondary"
        loading={createArea.isPending}
        disabled={!name.trim()}
      />
    </Card>
  );
}

function AddRoom({ homeId, areas }: { homeId: string; areas: Area[] }) {
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState<string>(NO_AREA);
  const createRoom = useCreateRoom(homeId);

  const onSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createRoom.mutate(
      { name: trimmed, area_id: areaId === NO_AREA ? null : areaId },
      { onSuccess: () => setName('') },
    );
  };

  const areaOptions = [NO_AREA, ...areas.map((area) => area.id)];
  const areaLabel = (id: string) =>
    id === NO_AREA ? 'No area' : (areas.find((a) => a.id === id)?.name ?? id);

  return (
    <Card>
      <ThemedText type="smallBold">Add a room</ThemedText>
      <TextField
        label="Room name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Utility Room"
      />
      {areas.length > 0 ? (
        <>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Area
          </ThemedText>
          <Chips
            options={areaOptions}
            value={areaId}
            onChange={setAreaId}
            labelFor={areaLabel}
          />
        </>
      ) : null}
      <Button
        label="Add Room"
        onPress={onSubmit}
        loading={createRoom.isPending}
        disabled={!name.trim()}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
});
