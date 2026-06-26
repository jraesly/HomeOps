import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import { useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { parseDeviceDeepLink } from '@/utils/links';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  if (Platform.OS === 'web') {
    return (
      <Screen title="Scan QR">
        <ThemedText themeColor="textSecondary">
          QR scanning is available in the mobile app.
        </ThemedText>
      </Screen>
    );
  }

  if (!permission) {
    return <Screen title="Scan QR" />;
  }

  if (!permission.granted) {
    return (
      <Screen title="Scan QR">
        <ThemedText themeColor="textSecondary">
          Camera access is needed to scan device QR codes.
        </ThemedText>
        <Button label="Grant camera access" onPress={requestPermission} />
      </Screen>
    );
  }

  const onScanned = ({ data }: { data: string }) => {
    if (handled.current) return;
    const id = parseDeviceDeepLink(data);
    if (id) {
      handled.current = true;
      router.replace(`/device/${id}`);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Scan QR' }} />
      <View style={styles.fill}>
        <CameraView
          style={styles.fill}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onScanned}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
