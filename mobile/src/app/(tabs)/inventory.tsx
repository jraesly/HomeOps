import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import {
  useConsumables,
  useCreateConsumable,
  useCurrentHome,
  useUpdateConsumable,
} from '@/api/hooks';
import type { Consumable } from '@/api/types';
import { Badge } from '@/components/badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardRow } from '@/components/ui/card';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { Screen } from '@/components/ui/screen';
import { EmptyView } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';

export default function InventoryScreen() {
  const homeQuery = useCurrentHome();
  const home = homeQuery.data;
  const consumablesQuery = useConsumables(home?.id);

  return (
    <QueryBoundary
      title="Inventory"
      query={consumablesQuery}
      gates={[homeQuery]}>
      {(consumables) => (
        <Screen title="Inventory">
          {home ? <AddConsumable homeId={home.id} /> : null}
          <View style={styles.list}>
            {consumables.length === 0 ? (
              <EmptyView message="No consumables yet. Add filters, salt, batteries…" />
            ) : (
              consumables.map((consumable) => (
                <ConsumableRow
                  key={consumable.id}
                  homeId={consumable.home_id}
                  consumable={consumable}
                />
              ))
            )}
          </View>
        </Screen>
      )}
    </QueryBoundary>
  );
}

function ConsumableRow({
  homeId,
  consumable,
}: {
  homeId: string;
  consumable: Consumable;
}) {
  const update = useUpdateConsumable(homeId);
  const lowStock = consumable.quantity_on_hand <= consumable.reorder_threshold;

  const adjust = (delta: number) => {
    const next = Math.max(0, consumable.quantity_on_hand + delta);
    if (next === consumable.quantity_on_hand) return;
    update.mutate({
      consumableId: consumable.id,
      payload: { quantity_on_hand: next },
    });
  };

  return (
    <Card>
      <CardRow>
        <ThemedText type="smallBold" style={styles.flexShrink}>
          {consumable.name}
        </ThemedText>
        {lowStock ? <Badge label="Low stock" color="#D97706" /> : null}
      </CardRow>
      {consumable.category ? (
        <ThemedText type="small" themeColor="textSecondary">
          {consumable.category}
        </ThemedText>
      ) : null}
      <CardRow>
        <ThemedText type="small" themeColor="textSecondary">
          {consumable.quantity_on_hand} on hand · reorder at{' '}
          {consumable.reorder_threshold}
        </ThemedText>
        <View style={styles.stepper}>
          <Stepper label="−" onPress={() => adjust(-1)} />
          <Stepper label="+" onPress={() => adjust(1)} />
        </View>
      </CardRow>
      {consumable.reorder_url ? (
        <Button
          label={lowStock ? 'Reorder now' : 'Reorder'}
          variant="secondary"
          onPress={() => Linking.openURL(consumable.reorder_url as string)}
        />
      ) : null}
    </Card>
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundSelected" style={styles.stepperButton}>
        <ThemedText type="smallBold">{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function AddConsumable({ homeId }: { homeId: string }) {
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
      {
        onSuccess: () => {
          setName('');
          setCategory('');
          setQuantity('0');
          setThreshold('1');
          setReorderUrl('');
        },
      },
    );
  };

  return (
    <Card>
      <ThemedText type="smallBold">Add a consumable</ThemedText>
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. 16x25x1 HVAC Filter"
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
  list: { gap: Spacing.two },
  flexShrink: { flexShrink: 1 },
  row: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
  stepper: { flexDirection: 'row', gap: Spacing.two },
  stepperButton: {
    width: 40,
    height: 36,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
