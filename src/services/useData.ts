import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from './session';

export interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Carga datos persistidos al enfocar la pantalla y cuando cambia la versión de datos o el perfil. */
export function useData<T>(loader: () => Promise<T>, deps: unknown[] = []): DataState<T> {
  const { version, activeProfile } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const loaderRef = useRef(loader);
  useEffect(() => { loaderRef.current = loader; });
  const depsKey = JSON.stringify(deps);

  const run = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    try {
      const d = await loaderRef.current();
      if (my === seq.current) { setData(d); setError(null); }
    } catch (e) {
      if (my === seq.current) setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.');
    } finally {
      if (my === seq.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, activeProfile?.id, depsKey]);

  useFocusEffect(useCallback(() => { void run(); }, [run]));
  return { data, loading, error, reload: run };
}
