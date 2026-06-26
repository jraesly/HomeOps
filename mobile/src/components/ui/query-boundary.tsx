import type { ReactNode } from 'react';

import { Screen } from '@/components/ui/screen';
import { ErrorView, LoadingView } from '@/components/ui/state-views';

type QueryLike<T> = {
  data: T | undefined;
  error: unknown;
  refetch?: () => unknown;
};

type QueryBoundaryProps<T> = {
  /** Primary query whose data the screen renders. */
  query: QueryLike<T>;
  /** Optional title for the loading/error screen state. */
  title?: string;
  /** Extra queries whose errors should also surface (e.g. the current home). */
  gates?: { error: unknown }[];
  children: (data: T) => ReactNode;
};

/**
 * Centralizes the loading/error/guard preamble repeated across screens. Shows a
 * loading state (with a cold-start "waking up" hint) until the primary query
 * has data, an error state (with retry) on failure, then renders children(data).
 */
export function QueryBoundary<T>({
  query,
  title,
  gates,
  children,
}: QueryBoundaryProps<T>) {
  const gateError = gates?.find((gate) => gate.error)?.error;
  const error = query.error ?? gateError ?? null;

  if (!error && query.data === undefined) {
    return (
      <Screen title={title}>
        <LoadingView />
      </Screen>
    );
  }

  if (error || query.data === undefined) {
    return (
      <Screen title={title}>
        <ErrorView error={error} onRetry={query.refetch} />
      </Screen>
    );
  }

  return <>{children(query.data)}</>;
}
