import { AUTHORIZE_URL, OAUTH_CLIENT_ID, OAUTH_REDIRECT_URI, OAUTH_SCOPE } from '@/config';

export type RedirectResult = {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
};

const CONSOLE_HOST = 'console.ziacentro.mx';

export function authorizeUrl(challenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT_URI,
    response_type: 'code',
    scope: OAUTH_SCOPE,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

/** La consola recibe el código en el query. Cualquier otra URL se deja pasar. */
export function parseConsoleRedirect(url: string): RedirectResult | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== CONSOLE_HOST) return null;
  const code = parsed.searchParams.get('code') ?? undefined;
  const state = parsed.searchParams.get('state') ?? undefined;
  const error = parsed.searchParams.get('error') ?? undefined;
  const errorDescription = parsed.searchParams.get('error_description') ?? undefined;
  if (!code && !error) {
    return { error: 'missing_code', errorDescription: 'La consola no devolvió un código de acceso.' };
  }
  return { code, state, error, errorDescription };
}

export function oauthErrorMessage(error: string | undefined, description: string | undefined): string {
  if (error === 'access_denied') return 'Se canceló el acceso.';
  if (error === 'missing_code') return description ?? 'La consola no devolvió un código de acceso.';
  if (description && description.length < 180 && !/openiddict|exception/i.test(description)) {
    return 'No se pudo completar el acceso. Vuelve a intentarlo.';
  }
  return 'No se pudo completar el acceso. Vuelve a intentarlo.';
}
