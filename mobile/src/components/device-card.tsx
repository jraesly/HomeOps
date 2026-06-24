import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, CardRow } from '@/components/ui/card';
import type { Device } from '@/api/types';
import { humanize } from '@/utils/format';

export function DeviceCard({ device }: { device: Device }) {
  const router = useRouter();
  return (
    <Card onPress={() => router.push(`/device/${device.id}`)}>
      <CardRow>
        <ThemedText type="smallBold" style={styles.name}>
          {device.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {device.device_type}
        </ThemedText>
      </CardRow>
      <ThemedText type="small" themeColor="textSecondary">
        {humanize(device.status)}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  name: { flexShrink: 1 },
});
