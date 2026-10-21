/** API de producción de la consola. `EXPO_PUBLIC_API_URL` la sustituye en desarrollo. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.ziacentro.mx').replace(
  /\/$/,
  '',
);

/**
 * Cliente público que ya usa https://console.ziacentro.mx.
 * Solo admite `authorization_code` + PKCE y `refresh_token`,
 * y el único redirect registrado es la propia consola.
 */
export const OAUTH_CLIENT_ID = 'IgasConsole_App';
export const OAUTH_REDIRECT_URI = 'https://console.ziacentro.mx';
export const OAUTH_SCOPE = 'offline_access IgasConsole';

export const AUTHORIZE_URL = `${API_URL}/connect/authorize`;
export const TOKEN_URL = `${API_URL}/connect/token`;
/** El discovery de producción publica este path, no `/connect/revocation`. */
export const REVOCATION_URL = `${API_URL}/connect/revocat`;
