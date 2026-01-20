'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Global error handler for React Query
 * Best practice: Centralize error handling for consistent UX
 */
function handleQueryError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Terjadi kesalahan';

  // Don't show toast for auth errors (handled by API client redirect)
  if (message.includes('Session expired') || message.includes('401')) {
    return;
  }

  toast.error(message);
}

/**
 * Create QueryClient with best practice configuration
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data considered fresh for 1 minute
        staleTime: 60 * 1000,
        // Keep unused data in cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry failed requests 3 times with exponential backoff
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error instanceof Error && error.message.includes('4')) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch on window focus (can be overwhelming)
        refetchOnWindowFocus: false,
        // Refetch on reconnect for fresh data
        refetchOnReconnect: true,
      },
      mutations: {
        // Show error toast on mutation failure
        onError: handleQueryError,
        // Retry mutations once
        retry: 1,
      },
    },
  });
}

/**
 * Create persister for localStorage cache
 * Best practice: Persist cache for faster initial loads
 */
function createPersister() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return createSyncStoragePersister({
    storage: window.localStorage,
    key: 'yakkum-query-cache',
    // Serialize/deserialize with JSON
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Best practice: Initialize QueryClient in useState to ensure one instance per app
  const [queryClient] = useState(createQueryClient);
  const [persister, setPersister] = useState<ReturnType<typeof createPersister>>(undefined);

  // Initialize persister on client side only
  useEffect(() => {
    setPersister(createPersister());
  }, []);

  // If persister is available, use PersistQueryClientProvider
  if (persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          // Cache expires after 24 hours
          maxAge: 24 * 60 * 60 * 1000,
          // Only persist successful queries
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              // Only persist queries that are fresh and successful
              return query.state.status === 'success';
            },
          },
        }}
      >
        {children}
        {/* Only show devtools in development */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        )}
      </PersistQueryClientProvider>
    );
  }

  // Fallback to regular provider (SSR or before hydration)
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}

/**
 * Hook to access QueryClient outside of components
 * Best practice: Export for use in loaders, actions, etc.
 */
export { useQueryClient } from '@tanstack/react-query';
