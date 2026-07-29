import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAreas, useCurrentHome, useRooms } from '@/api/hooks';
import type { Area, Room } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { AddButton } from '@/components/ui/add-button';
import { Card, CardRow } from '@/components/ui/card';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { Screen } from '@/components/ui/screen';
import { EmptyView } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';

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
          <RoomsContent rooms={rooms} areas={areasQuery.data ?? []} />
        ) : null
      }
    </QueryBoundary>
  );
}

function RoomsContent({ rooms, areas: rawAreas }: { rooms: Room[]; areas: Area[] }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const areas = [...rawAreas].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  );
  const groups = buildGroups(areas, rooms);

  const openAdd = (type: 'room' | 'area') => {
    setMenuOpen(false);
    router.push(`/add?type=${type}`);
  };

  return (
    <Screen
      title="Rooms"
      action={<AddButton onPress={() => setMenuOpen((open) => !open)} />}>
      {menuOpen ? (
        <Card>
          <MenuOption label="Add a room" onPress={() => openAdd('room')} />
          <MenuOption
            label="Add an area / floor"
            onPress={() => openAdd('area')}
          />
        </Card>
      ) : null}

      {rooms.length === 0 ? (
        <EmptyView message="No rooms yet. Tap + to add your first room." />
      ) : (
        groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <ThemedText type="smallBold" themeColor="accent">
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

function MenuOption({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuOption, pressed && styles.pressed]}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText type="smallBold" themeColor="accent">
        ›
      </ThemedText>
    </Pressable>
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

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  pressed: { opacity: 0.7 },
});
