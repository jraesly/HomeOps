import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/badge';
import { ThemedText } from '@/components/themed-text';
import { Card, CardRow } from '@/components/ui/card';
import type { Device } from '@/api/types';
import { describeDue, humanize, isOverdue } from '@/utils/format';

type DeviceCardProps = {
  device: Device;
  /** Optional room name shown when the card appears outside its room. */
  roomName?: string;
};

export function DeviceCard({ device, roomName }: DeviceCardProps) {
  const router = useRouter();
  const overdue = isOverdue(device.next_due);

  const subtitle = roomName
    ? `${roomName} · ${device.device_type}`
    : device.device_type;

  return (
    <Card onPress={() => router.push(`/device/${device.id}`)}>
      <CardRow>
        <ThemedText type="smallBold" style={styles.name}>
          {device.name}
        </ThemedText>
        {overdue ? <Badge label="Overdue" color="#DC2626" /> : null}
      </CardRow>
      <ThemedText type="small" themeColor="textSecondary">
        {subtitle}
      </ThemedText>
      {device.next_due ? (
        <View style={styles.nextRow}>
          <ThemedText
            type="small"
            themeColor={overdue ? undefined : 'textSecondary'}
            style={overdue ? styles.overdue : undefined}>
            Next: {describeDue(device.next_due)}
          </ThemedText>
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          {humanize(device.status)}
        </ThemedText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  name: { flexShrink: 1 },
  nextRow: { flexDirection: 'row' },
  overdue: { color: '#DC2626' },
});
