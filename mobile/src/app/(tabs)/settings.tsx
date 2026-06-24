import { API_BASE_URL } from '@/api/config';
import { useCurrentHome } from '@/api/hooks';
import { ThemedText } from '@/components/themed-text';
import { Card, CardRow } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';

export default function SettingsScreen() {
  const homeQuery = useCurrentHome();

  return (
    <Screen title="Settings">
      <Card>
        <CardRow>
          <ThemedText type="smallBold">Home</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {homeQuery.data?.name ?? '—'}
          </ThemedText>
        </CardRow>
        <CardRow>
          <ThemedText type="smallBold">Timezone</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {homeQuery.data?.timezone ?? '—'}
          </ThemedText>
        </CardRow>
      </Card>

      <Card>
        <CardRow>
          <ThemedText type="smallBold">API</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {API_BASE_URL}
          </ThemedText>
        </CardRow>
        <ThemedText type="small" themeColor="textSecondary">
          Set EXPO_PUBLIC_API_URL to point the app at your backend.
        </ThemedText>
      </Card>

      <Card>
        <ThemedText type="smallBold">HomeOps</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Phase 2 — mobile shell connected to the FastAPI backend.
        </ThemedText>
      </Card>
    </Screen>
  );
}
