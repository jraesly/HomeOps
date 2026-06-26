import * as Print from 'expo-print';
import { useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { deviceDeepLink } from '@/utils/links';

type QrRef = { toDataURL?: (cb: (data: string) => void) => void };

/** Renders a device QR code with a print action (for sticking on the device). */
export function QrLabel({
  deviceId,
  deviceName,
}: {
  deviceId: string;
  deviceName: string;
}) {
  const ref = useRef<QrRef | null>(null);
  const url = deviceDeepLink(deviceId);

  const onPrint = () => {
    const node = ref.current;
    if (!node?.toDataURL) return;
    node.toDataURL((base64: string) => {
      const html = `
        <html><body style="text-align:center;font-family:-apple-system,sans-serif;padding:40px">
          <h2>${deviceName}</h2>
          <img style="width:280px;height:280px" src="data:image/png;base64,${base64}" />
          <p style="color:#888">HomeOps</p>
        </body></html>`;
      void Print.printAsync({ html });
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.qr}>
        <QRCode value={url} size={160} getRef={(c) => (ref.current = c)} />
      </View>
      {Platform.OS !== 'web' || typeof window !== 'undefined' ? (
        <Button label="Print QR label" variant="secondary" onPress={onPrint} />
      ) : null}
      <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
        Print this and stick it on the device. Scanning it opens this screen.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.two },
  qr: {
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  hint: { textAlign: 'center' },
});
