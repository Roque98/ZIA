import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/session';

type State<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
};

export function useApi<T>(load: () => Promise<T>): State<T> {
  const { session } = useSession();
  const token = session?.accessToken ?? '';
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const run = useCallback(
    async (mode: 'load' | 'refresh') => {
      if (!token) return;
      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      try {
        const next = await load();
        setData(next);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load, token],
  );

  useEffect(() => {
    setData(null);
    void run('load');
  }, [run]);

  const refresh = useCallback(() => {
    void run('refresh');
  }, [run]);

  return { data, error, loading, refreshing, refresh };
}
