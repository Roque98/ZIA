import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { revokeSession, sessionFromToken } from '@/api';
import { setAuthBridge } from '@/auth-bridge';
import type { Session, TokenResponse } from '@/types';

const STORAGE_KEY = 'zia.session';
const CHUNK = 1800;

type WebStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

type SessionContextValue = {
  session: Session | null;
  isLoading: boolean;
  signInWithToken: (tokens: TokenResponse) => Promise<void>;
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
    if (!data?.accessToken || !data.user?.id || !data.user?.name) return null;
    return data;
  } catch {
    return null;
  }
}

async function readChunks(key: string): Promise<string | null> {
  const countRaw = await SecureStore.getItemAsync(`${key}.n`);
  const count = countRaw ? Number(countRaw) : 0;
  if (!count) return null;
  const parts: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const part = await SecureStore.getItemAsync(`${key}.${index}`);
    if (part == null) return null;
    parts.push(part);
  }
  return parts.join('');
}

async function writeChunks(key: string, value: string | null): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(`${key}.n`);
  const previous = countRaw ? Number(countRaw) : 0;
  if (value === null) {
    for (let index = 0; index < previous; index += 1) {
      await SecureStore.deleteItemAsync(`${key}.${index}`);
    }
    if (countRaw) await SecureStore.deleteItemAsync(`${key}.n`);
    return;
  }
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += CHUNK) {
    chunks.push(value.slice(index, index + CHUNK));
  }
  await SecureStore.setItemAsync(`${key}.n`, String(chunks.length));
  for (let index = 0; index < chunks.length; index += 1) {
    await SecureStore.setItemAsync(`${key}.${index}`, chunks[index] ?? '');
  }
  for (let index = chunks.length; index < previous; index += 1) {
    await SecureStore.deleteItemAsync(`${key}.${index}`);
  }
}

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') return webStorage()?.getItem(STORAGE_KEY) ?? null;
  const chunked = await readChunks(STORAGE_KEY);
  if (chunked) return chunked;
  const legacy = await SecureStore.getItemAsync(STORAGE_KEY).catch(() => null);
  if (legacy) await SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => undefined);
  return null;
}

async function writeRaw(value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    const storage = webStorage();
    if (!storage) return;
    if (value === null) storage.removeItem(STORAGE_KEY);
    else storage.setItem(STORAGE_KEY, value);
    return;
  }
  await writeChunks(STORAGE_KEY, value);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;

  const persist = useCallback(async (next: Session | null) => {
    sessionRef.current = next;
    setSession(next);
    await writeRaw(next ? JSON.stringify(next) : null);
  }, []);

  setAuthBridge({
    getSession: () => sessionRef.current,
    saveSession: (next) => persist(next),
    clearSession: () => persist(null),
  });

  useEffect(() => {
    let active = true;
    readRaw()
      .then((raw) => {
        if (active) {
          const parsed = parseSession(raw);
          sessionRef.current = parsed;
          setSession(parsed);
        }
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

  const signInWithToken = useCallback(
    async (tokens: TokenResponse) => {
      const next = await sessionFromToken(tokens);
      await persist(next);
    },
    [persist],
  );

  const signOut = useCallback(async () => {
    const current = sessionRef.current;
    sessionRef.current = null;
    setSession(null);
    await writeRaw(null);
    if (current) await revokeSession(current);
  }, []);

  const value = useMemo(
    () => ({ session, isLoading, signInWithToken, signOut }),
    [session, isLoading, signInWithToken, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession debe usarse dentro de SessionProvider.');
  return value;
}
