import type { Session } from '@/types';

type AuthBridge = {
  getSession: () => Session | null;
  saveSession: (session: Session) => Promise<void>;
  clearSession: () => Promise<void>;
};

let bridge: AuthBridge | null = null;

export function setAuthBridge(next: AuthBridge): void {
  bridge = next;
}

export function getAuthBridge(): AuthBridge {
  if (!bridge) {
    throw new Error('La sesión todavía no está lista.');
  }
  return bridge;
}
