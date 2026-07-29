import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { useCreateLog } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';

/** Modal for logging unplanned maintenance, opened from the device screen "+". */
export default function AddLogScreen() {
  const router = useRouter();
  const { homeId, deviceId } = useLocalSearchParams<{
    homeId: string;
    deviceId: string;
  }>();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const createLog = useCreateLog(homeId, deviceId);

  const onSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const dollars = parseFloat(cost);
    createLog.mutate(
      {
        title: trimmed,
        notes: notes.trim() ? notes.trim() : null,
        cost_cents: Number.isFinite(dollars) ? Math.round(dollars * 100) : null,
        performed_by: performedBy.trim() ? performedBy.trim() : null,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Log Maintenance' }} />
      <Screen>
        <Card>
          <TextField
            label="What happened?"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. HVAC tech replaced capacitor"
            autoFocus
          />
          <TextField
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Details"
          />
          <TextField
            label="Cost (optional)"
            value={cost}
            onChangeText={setCost}
            keyboardType="numeric"
            placeholder="250.00"
          />
          <TextField
            label="Performed by (optional)"
            value={performedBy}
            onChangeText={setPerformedBy}
            placeholder="e.g. ACME HVAC"
          />
          <Button
            label="Add Log"
            onPress={onSubmit}
            loading={createLog.isPending}
            disabled={!title.trim()}
          />
        </Card>
      </Screen>
    </>
  );
}
