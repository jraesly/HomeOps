import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import {
  useConsumables,
  useCurrentHome,
  useUpdateConsumable,
} from '@/api/hooks';
import type { Consumable } from '@/api/types';
import { Badge } from '@/components/badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AddButton } from '@/components/ui/add-button';
import { Button } from '@/components/ui/button';
import { Card, CardRow } from '@/components/ui/card';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { Screen } from '@/components/ui/screen';
import { EmptyView } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';

export default function InventoryScreen() {
  const router = useRouter();
  const homeQuery = useCurrentHome();
  const home = homeQuery.data;
  const consumablesQuery = useConsumables(home?.id);

  return (
    <QueryBoundary
      title="Inventory"
      query={consumablesQuery}
      gates={[homeQuery]}>
      {(consumables) => (
        <Screen
          title="Inventory"
          action={
            <AddButton
              onPress={() => router.push('/add?type=consumable')}
              label="Add consumable"
            />
          }>
          <View style={styles.list}>
            {consumables.length === 0 ? (
              <EmptyView message="No consumables yet. Tap + to add filters, salt, batteries…" />
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

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  flexShrink: { flexShrink: 1 },
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
