import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
};

const PRIMARY_COLOR = '#208AEF';

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : PRIMARY_COLOR} />
      ) : (
        <ThemedText
          type="smallBold"
          style={isPrimary ? styles.primaryLabel : styles.secondaryLabel}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primary: { backgroundColor: PRIMARY_COLOR },
  secondary: { borderWidth: 1, borderColor: PRIMARY_COLOR },
  primaryLabel: { color: '#ffffff' },
  secondaryLabel: { color: PRIMARY_COLOR },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
});
