import * as Linking from 'expo-linking';

/** Deep link that opens the app directly on a device's detail screen. */
export function deviceDeepLink(deviceId: string): string {
  return Linking.createURL(`/device/${deviceId}`);
}

/** Extract a device id from a scanned deep link, or null if it isn't one. */
export function parseDeviceDeepLink(url: string): string | null {
  const match = url.match(/\/device\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
