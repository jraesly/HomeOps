import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import {
  useAreas,
  useCreateArea,
  useCreateConsumable,
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
import { Spacing } from '@/constants/theme';

const NO_AREA = '';
const TYPES = ['room', 'area', 'consumable'] as const;
type AddType = (typeof TYPES)[number];

const TYPE_LABELS: Record<AddType, string> = {
  room: 'Room',
  area: 'Area / floor',
  consumable: 'Consumable',
};

function isAddType(value: string | undefined): value is AddType {
  return (TYPES as readonly string[]).includes(value ?? '');
}

/** Modal for adding a room, area, or consumable — opened from tab "+" buttons. */
export default function AddScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const [type, setType] = useState<AddType>(
    isAddType(params.type) ? params.type : 'room',
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
        ) : type === 'area' ? (
          <AddAreaForm homeId={homeId} />
        ) : (
          <AddConsumableForm homeId={homeId} />
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

function AddConsumableForm({ homeId }: { homeId: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [threshold, setThreshold] = useState('1');
  const [reorderUrl, setReorderUrl] = useState('');
  const create = useCreateConsumable(homeId);

  const onSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(
      {
        name: trimmed,
        category: category.trim() ? category.trim() : null,
        quantity_on_hand: Math.max(0, parseInt(quantity, 10) || 0),
        reorder_threshold: Math.max(0, parseInt(threshold, 10) || 0),
        reorder_url: reorderUrl.trim() ? reorderUrl.trim() : null,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Card>
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. 16x25x1 HVAC Filter"
        autoFocus
      />
      <TextField
        label="Category (optional)"
        value={category}
        onChangeText={setCategory}
        placeholder="e.g. filter"
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField
            label="On hand"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.flex}>
          <TextField
            label="Reorder at"
            value={threshold}
            onChangeText={setThreshold}
            keyboardType="numeric"
          />
        </View>
      </View>
      <TextField
        label="Reorder URL (optional)"
        value={reorderUrl}
        onChangeText={setReorderUrl}
        placeholder="https://… (one-tap reorder)"
      />
      <Button
        label="Add Consumable"
        onPress={onSubmit}
        loading={create.isPending}
        disabled={!name.trim()}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
});
