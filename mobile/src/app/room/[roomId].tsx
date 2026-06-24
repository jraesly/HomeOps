import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useCreateDevice, useDevices, useRoom } from '@/api/hooks';
import type { DeviceType } from '@/api/types';
import { DeviceCard } from '@/components/device-card';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';

const DEVICE_TYPES: readonly DeviceType[] = [
  'HVAC',
  'Water Treatment',
  'Appliance',
  'Plumbing',
  'Electrical',
  'Exterior',
  'Garden',
  'Safety',
  'Network',
  'Other',
];

export default function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const roomQuery = useRoom(roomId);
  const room = roomQuery.data;
  const devicesQuery = useDevices(room?.home_id);

  if (roomQuery.isLoading) {
    return (
      <Screen title="Room">
        <LoadingView />
      </Screen>
    );
  }
  if (roomQuery.error || !room) {
    return (
      <Screen title="Room">
        <ErrorView error={roomQuery.error ?? new Error('Room not found')} />
      </Screen>
    );
  }

  const devices = (devicesQuery.data ?? []).filter((d) => d.room_id === room.id);

  return (
    <>
      <Stack.Screen options={{ title: room.name }} />
      <Screen title={room.name} subtitle={room.room_type ?? undefined}>
        <AddDevice homeId={room.home_id} roomId={room.id} />
        <View style={styles.list}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            DEVICES
          </ThemedText>
          {devices.length === 0 ? (
            <EmptyView message="No devices in this room yet." />
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

function AddDevice({ homeId, roomId }: { homeId: string; roomId: string }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<DeviceType>('Other');
  const createDevice = useCreateDevice(homeId, roomId);

  const onSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createDevice.mutate(
      { name: trimmed, device_type: type },
      {
        onSuccess: () => {
          setName('');
          setType('Other');
        },
      },
    );
  };

  return (
    <Card>
      <ThemedText type="smallBold">Add a device</ThemedText>
      <TextField
        label="Device name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Whole-House Filter"
      />
      <ThemedText type="smallBold" themeColor="textSecondary">
        Type
      </ThemedText>
      <Chips options={DEVICE_TYPES} value={type} onChange={setType} />
      <Button
        label="Add Device"
        onPress={onSubmit}
        loading={createDevice.isPending}
        disabled={!name.trim()}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
});
