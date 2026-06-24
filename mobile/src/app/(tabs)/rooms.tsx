import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useCreateRoom, useCurrentHome, useRooms } from '@/api/hooks';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card, CardRow } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';

export default function RoomsScreen() {
  const router = useRouter();
  const homeQuery = useCurrentHome();
  const home = homeQuery.data;
  const roomsQuery = useRooms(home?.id);

  if (homeQuery.isLoading || roomsQuery.isLoading) {
    return (
      <Screen title="Rooms">
        <LoadingView />
      </Screen>
    );
  }

  const error = homeQuery.error ?? roomsQuery.error;
  if (error || !home) {
    return (
      <Screen title="Rooms">
        <ErrorView error={error ?? new Error('No home')} />
      </Screen>
    );
  }

  const rooms = roomsQuery.data ?? [];

  return (
    <Screen title="Rooms">
      <AddRoom homeId={home.id} />
      <View style={styles.list}>
        {rooms.length === 0 ? (
          <EmptyView message="No rooms yet. Add your first room above." />
        ) : (
          rooms.map((room) => (
            <Card key={room.id} onPress={() => router.push(`/room/${room.id}`)}>
              <CardRow>
                <ThemedText type="smallBold">{room.name}</ThemedText>
                {room.room_type ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {room.room_type}
                  </ThemedText>
                ) : null}
              </CardRow>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

function AddRoom({ homeId }: { homeId: string }) {
  const [name, setName] = useState('');
  const createRoom = useCreateRoom(homeId);

  const onSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createRoom.mutate(
      { name: trimmed },
      { onSuccess: () => setName('') },
    );
  };

  return (
    <Card>
      <ThemedText type="smallBold">Add a room</ThemedText>
      <TextField
        label="Room name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Utility Room"
      />
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
  list: { gap: Spacing.two },
});
