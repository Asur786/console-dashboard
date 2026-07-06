import { useState, useEffect, useCallback } from 'react';
import type { ApiError } from '../types';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useApi<T>(fetchFn: () => Promise<T>): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchFn()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: ApiError) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return { data, isLoading, error, refetch };
}
