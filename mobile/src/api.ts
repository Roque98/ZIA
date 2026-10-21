import { deadlines, stationById, stations, tramiteById, tramites } from '@/data';
import type { DashboardData, Deadline, Session, SessionUser, Station, Tramite } from '@/types';

/**
 * Este repositorio no tiene API de consola ni de autenticación.
 * La landing solo habla con el chatbot público en `/api/chat` (sesión, mensaje y lead);
 * ese servicio no identifica clientes ni entrega expedientes.
 *
 * Si más adelante existe un backend, `EXPO_PUBLIC_API_URL` activa el contrato de abajo.
 * Sin esa variable, el acceso y los datos son locales y quedan marcados como demostración.
 *
 *   POST {API}/auth/login   { email, password } → { token, user }
 *   GET  {API}/estaciones
 *   GET  {API}/estaciones/:id
 *   GET  {API}/tramites
 *   GET  {API}/tramites/:id
 *   GET  {API}/vencimientos
 */

export const DEMO_EMAIL = 'laura.mendez@demo.zia';
export const DEMO_PASSWORD = 'zia-demo';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';

export function usesRemoteApi(): boolean {
  return API_URL.length > 0;
}

const demoUser: SessionUser = {
  id: 'usr_demo',
  name: 'Laura Méndez',
  firstName: 'Laura',
  email: DEMO_EMAIL,
  role: 'Administradora',
  company: 'Grupo Estaciones del Pacífico',
  office: 'Centro · Tijuana',
  phone: '664 159 4369',
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function authHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error('No hay conexión con el servidor.');
  }
  if (response.status === 401) {
    throw new HttpError(401, 'Correo o contraseña incorrectos.');
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new HttpError(response.status, body?.message ?? 'No se pudo completar la solicitud.');
  }
  return (await response.json()) as T;
}

function sessionFromApi(data: unknown): Session {
  if (!data || typeof data !== 'object') {
    throw new Error('La respuesta de acceso no es válida.');
  }
  const body = data as { token?: unknown; user?: Partial<SessionUser> };
  const user = body.user;
  if (typeof body.token !== 'string' || !user || typeof user.email !== 'string' || typeof user.name !== 'string') {
    throw new Error('La respuesta de acceso no es válida.');
  }
  const name = user.name;
  return {
    token: body.token,
    source: 'api',
    user: {
      id: String(user.id ?? user.email),
      name,
      firstName: user.firstName ?? name.split(' ')[0] ?? name,
      email: user.email,
      role: user.role ?? 'Cliente',
      company: user.company ?? '',
      office: user.office ?? '',
      phone: user.phone ?? '',
    },
  };
}

export async function login(email: string, password: string): Promise<Session> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    throw new Error('Escribe el correo y la contraseña.');
  }

  if (usesRemoteApi()) {
    const data = await request<unknown>(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalized, password }),
    });
    return sessionFromApi(data);
  }

  await wait(450);
  if (normalized !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    throw new Error('Correo o contraseña incorrectos.');
  }
  return { token: 'demo.local', source: 'mock', user: demoUser };
}

export async function fetchDashboard(token: string): Promise<DashboardData> {
  if (!usesRemoteApi()) {
    return { stations, tramites, deadlines };
  }
  const headers = authHeaders(token);
  const [stationRows, tramiteRows, deadlineRows] = await Promise.all([
    request<Station[]>(`${API_URL}/estaciones`, { headers }),
    request<Tramite[]>(`${API_URL}/tramites`, { headers }),
    request<Deadline[]>(`${API_URL}/vencimientos`, { headers }),
  ]);
  return { stations: stationRows, tramites: tramiteRows, deadlines: deadlineRows };
}

export async function fetchStations(token: string): Promise<Station[]> {
  if (!usesRemoteApi()) return stations;
  return request<Station[]>(`${API_URL}/estaciones`, { headers: authHeaders(token) });
}

export async function fetchStation(token: string, id: string): Promise<Station | null> {
  if (!usesRemoteApi()) return stationById(id) ?? null;
  try {
    return await request<Station>(`${API_URL}/estaciones/${encodeURIComponent(id)}`, {
      headers: authHeaders(token),
    });
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchTramites(token: string): Promise<Tramite[]> {
  if (!usesRemoteApi()) return tramites;
  return request<Tramite[]>(`${API_URL}/tramites`, { headers: authHeaders(token) });
}

export async function fetchTramite(token: string, id: string): Promise<Tramite | null> {
  if (!usesRemoteApi()) return tramiteById(id) ?? null;
  try {
    return await request<Tramite>(`${API_URL}/tramites/${encodeURIComponent(id)}`, {
      headers: authHeaders(token),
    });
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchDeadlines(token: string): Promise<Deadline[]> {
  if (!usesRemoteApi()) return deadlines;
  return request<Deadline[]>(`${API_URL}/vencimientos`, { headers: authHeaders(token) });
}
