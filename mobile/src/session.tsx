import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { login } from '@/api';
import type { Session } from '@/types';

const STORAGE_KEY = 'zia.session';

type WebStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

type SessionContextValue = {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function webStorage(): WebStorage | null {
  const storage = (globalThis as { localStorage?: WebStorage }).localStorage;
  return storage ?? null;
}

function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Session;
    if (!data?.token || !data.user?.email || !data.user?.name) return null;
    return data;
  } catch {
    return null;
  }
}

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webStorage()?.getItem(STORAGE_KEY) ?? null;
  }
  return SecureStore.getItemAsync(STORAGE_KEY);
}

async function writeRaw(value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    const storage = webStorage();
    if (!storage) return;
    if (value === null) storage.removeItem(STORAGE_KEY);
    else storage.setItem(STORAGE_KEY, value);
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(STORAGE_KEY);
  else await SecureStore.setItemAsync(STORAGE_KEY, value);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    readRaw()
      .then((raw) => {
        if (active) setSession(parseSession(raw));
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await login(email, password);
    await writeRaw(JSON.stringify(next));
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    await writeRaw(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, isLoading, signIn, signOut }),
    [session, isLoading, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession debe usarse dentro de SessionProvider.');
  }
  return value;
}
