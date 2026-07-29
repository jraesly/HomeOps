import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import {
  useAreas,
  useCreateArea,
  useCreateRoom,
  useCurrentHome,
} from '@/api/hooks';
import type { Area } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { Screen } from '@/components/ui/screen';
import { LoadingView } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';

const NO_AREA = '';
const TYPES = ['room', 'area'] as const;
type AddType = (typeof TYPES)[number];

const TYPE_LABELS: Record<AddType, string> = {
  room: 'Room',
  area: 'Area / floor',
};

/** Modal for adding a room or an area, opened from the Rooms tab "+". */
export default function AddScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const [type, setType] = useState<AddType>(
    params.type === 'area' ? 'area' : 'room',
  );
  const homeQuery = useCurrentHome();
  const areasQuery = useAreas(homeQuery.data?.id);
  const homeId = homeQuery.data?.id;

  return (
    <>
      <Stack.Screen options={{ title: 'Add' }} />
      <Screen>
        <ThemedText type="smallBold" themeColor="textSecondary">
          What do you want to add?
        </ThemedText>
        <Chips
          options={[...TYPES]}
          value={type}
          onChange={(value) => setType(value as AddType)}
          labelFor={(value) => TYPE_LABELS[value as AddType]}
        />
        {!homeId ? (
          <LoadingView />
        ) : type === 'room' ? (
          <AddRoomForm homeId={homeId} areas={areasQuery.data ?? []} />
        ) : (
          <AddAreaForm homeId={homeId} />
        )}
      </Screen>
    </>
  );
}

function AddAreaForm({ homeId }: { homeId: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const createArea = useCreateArea(homeId);

  const onSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createArea.mutate(
      { name: trimmed },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Card>
      <TextField
        label="Area name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Main Floor"
        autoFocus
      />
      <Button
        label="Add Area"
        onPress={onSubmit}
        loading={createArea.isPending}
        disabled={!name.trim()}
      />
    </Card>
  );
}

function AddRoomForm({ homeId, areas }: { homeId: string; areas: Area[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState<string>(NO_AREA);
  const createRoom = useCreateRoom(homeId);

  const onSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createRoom.mutate(
      { name: trimmed, area_id: areaId === NO_AREA ? null : areaId },
      { onSuccess: () => router.back() },
    );
  };

  const areaOptions = [NO_AREA, ...areas.map((area) => area.id)];
  const areaLabel = (id: string) =>
    id === NO_AREA ? 'No area' : (areas.find((a) => a.id === id)?.name ?? id);

  return (
    <Card>
      <TextField
        label="Room name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Utility Room"
        autoFocus
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
