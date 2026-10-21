import { API_URL, OAUTH_CLIENT_ID, OAUTH_REDIRECT_URI, REVOCATION_URL, TOKEN_URL } from '@/config';
import { getAuthBridge } from '@/auth-bridge';
import { previewGet, STORE_PREVIEW } from '@/preview-data';
import type {
  Acceso,
  AlarmaEnOperacion,
  Auditoria,
  AuditoriaDetalle,
  Aviso,
  ContextoDeEstaciones,
  EstacionVista,
  Hallazgo,
  Historial,
  Inicio,
  Licencia,
  MiCuenta,
  OperacionDeEstacion,
  OperacionDeOrganizacion,
  PanelDeNodos,
  ProductoAuditado,
  Session,
  SessionUser,
  TokenResponse,
} from '@/types';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Json {
  return typeof value === 'object' && value !== null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function bool(value: unknown): boolean {
  return value === true;
}

function num(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function list<T>(value: unknown, map: (item: unknown) => T): T[] {
  return Array.isArray(value) ? value.map(map) : [];
}

async function readBody(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function messageFrom(body: unknown, fallback: string): string {
  if (!isRecord(body)) return fallback;
  const nested = isRecord(body.error) ? body.error : null;
  const candidate = text(nested?.message) ?? text(body.error_description) ?? text(body.message);
  if (!candidate) return fallback;
  if (/exception|openiddict|stack/i.test(candidate)) return fallback;
  return candidate.length > 180 ? fallback : candidate;
}

let refreshInFlight: Promise<Session | null> | null = null;

async function refreshSession(): Promise<Session | null> {
  const current = getAuthBridge().getSession();
  if (!current?.refreshToken) return null;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: OAUTH_CLIENT_ID,
    refresh_token: current.refreshToken,
  });
  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch {
    return current;
  }
  const payload = await readBody(response);
  if (!response.ok || !isRecord(payload) || typeof payload.access_token !== 'string') {
    if (response.status === 400) {
      await getAuthBridge().clearSession();
    }
    return null;
  }
  const next: Session = {
    ...current,
    accessToken: payload.access_token,
    refreshToken: typeof payload.refresh_token === 'string' ? payload.refresh_token : current.refreshToken,
    expiresAt: Date.now() + num(payload.expires_in || 3600) * 1000,
  };
  await getAuthBridge().saveSession(next);
  return next;
}

async function request(path: string, init: RequestInit | undefined, token: string, retry: boolean): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor.');
  }
  if (response.status === 401 && retry) {
    if (!refreshInFlight) {
      refreshInFlight = refreshSession().finally(() => {
        refreshInFlight = null;
      });
    }
    const next = await refreshInFlight;
    if (next) return request(path, init, next.accessToken, false);
    throw new ApiError(401, 'La sesión expiró. Entra de nuevo.');
  }
  const body = await readBody(response);
  if (!response.ok) {
    throw new ApiError(response.status, messageFrom(body, 'No se pudo completar la solicitud.'));
  }
  return body;
}

async function apiGet(path: string): Promise<unknown> {
  if (STORE_PREVIEW) return previewGet(path);
  const session = getAuthBridge().getSession();
  if (!session) throw new ApiError(401, 'La sesión expiró. Entra de nuevo.');
  return request(path, undefined, session.accessToken, true);
}

async function apiPost(path: string): Promise<unknown> {
  if (STORE_PREVIEW) return null;
  const session = getAuthBridge().getSession();
  if (!session) throw new ApiError(401, 'La sesión expiró. Entra de nuevo.');
  return request(path, { method: 'POST' }, session.accessToken, true);
}

export async function exchangeCode(code: string, verifier: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: OAUTH_CLIENT_ID,
    code,
    redirect_uri: OAUTH_REDIRECT_URI,
    code_verifier: verifier,
  });
  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor.');
  }
  const payload = await readBody(response);
  if (!response.ok || !isRecord(payload) || typeof payload.access_token !== 'string') {
    throw new ApiError(response.status, 'No se pudo completar el acceso. Vuelve a intentarlo.');
  }
  return {
    access_token: payload.access_token,
    refresh_token: typeof payload.refresh_token === 'string' ? payload.refresh_token : undefined,
    expires_in: typeof payload.expires_in === 'number' ? payload.expires_in : 3600,
    token_type: typeof payload.token_type === 'string' ? payload.token_type : 'Bearer',
  };
}

function mapUser(body: unknown): SessionUser {
  const current = isRecord(body) && isRecord(body.currentUser) ? body.currentUser : {};
  const name = [text(current.name), text(current.surName)].filter(Boolean).join(' ');
  const userName = text(current.userName) ?? '';
  return {
    id: text(current.id) ?? '',
    name: name || userName || 'Cuenta ZIA',
    email: text(current.email) ?? userName,
    userName,
    roles: list(current.roles, (role) => (typeof role === 'string' ? role : '')).filter(Boolean),
  };
}

export async function sessionFromToken(tokens: TokenResponse): Promise<Session> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/abp/application-configuration`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${tokens.access_token}` },
    });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor.');
  }
  const body = await readBody(response);
  if (!response.ok) {
    throw new ApiError(response.status, 'Entraste, pero no se pudo leer tu cuenta.');
  }
  const user = mapUser(body);
  if (!user.id) throw new ApiError(response.status, 'Entraste, pero no se pudo leer tu cuenta.');
  let organization: string | null = null;
  try {
    const contexto = await fetch(`${API_URL}/api/app/estaciones/contexto`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${tokens.access_token}` },
    });
    if (contexto.ok) {
      const payload = await contexto.json();
      const first = isRecord(payload) && Array.isArray(payload.organizaciones) ? payload.organizaciones[0] : null;
      organization = isRecord(first) ? text(first.nombre) : null;
    }
  } catch {
    organization = null;
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    user,
    organization,
  };
}

export async function revokeSession(session: Session): Promise<void> {
  const token = session.refreshToken ?? session.accessToken;
  const body = new URLSearchParams({
    token,
    token_type_hint: session.refreshToken ? 'refresh_token' : 'access_token',
    client_id: OAUTH_CLIENT_ID,
  });
  await fetch(REVOCATION_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  }).catch(() => undefined);
}

function mapNodo(value: unknown): OperacionDeEstacion['nodo'] {
  if (!isRecord(value)) return null;
  return {
    conectado: bool(value.conectado),
    ultimoLatido: text(value.ultimoLatido),
    version: text(value.version),
    plataforma: text(value.plataforma),
    nombreDeEquipo: text(value.nombreDeEquipo),
  };
}

function mapOperacion(value: unknown): OperacionDeEstacion {
  const row = isRecord(value) ? value : {};
  const ventas = isRecord(row.ventas) ? row.ventas : null;
  return {
    numPermiso: text(row.numPermiso) ?? '',
    nombre: text(row.nombre),
    nodo: mapNodo(row.nodo),
    configurada: bool(row.configurada),
    dia: text(row.dia),
    ventas: ventas
      ? {
          litros: num(ventas.litros),
          importe: num(ventas.importe),
          despachos: num(ventas.despachos),
          litrosPorHora: list(ventas.litrosPorHora, num),
          horaLocal: num(ventas.horaLocal),
        }
      : null,
    tanques: list(row.tanques, (item) => {
      const tank = isRecord(item) ? item : {};
      return {
        numero: num(tank.numero),
        producto: text(tank.producto),
        capacidad: num(tank.capacidad),
        volumen: tank.volumen == null ? null : num(tank.volumen),
        altura: tank.altura == null ? null : num(tank.altura),
        agua: tank.agua == null ? null : num(tank.agua),
        temperatura: tank.temperatura == null ? null : num(tank.temperatura),
      };
    }),
    dispensarios: list(row.dispensarios, (item) => {
      const pump = isRecord(item) ? item : {};
      return {
        numero: num(pump.numero),
        estado: text(pump.estado),
        producto: text(pump.producto),
        litros: num(pump.litros),
        importe: num(pump.importe),
        ultimoDespachoUtc: text(pump.ultimoDespachoUtc),
      };
    }),
    alarmas: list(row.alarmas, mapAlarma),
    balance: list(row.balance, (item) => {
      const line = isRecord(item) ? item : {};
      return {
        producto: text(line.producto),
        diferenciaLitros: num(line.diferenciaLitros),
        diferenciaPorcentaje: line.diferenciaPorcentaje == null ? null : num(line.diferenciaPorcentaje),
        enTolerancia: typeof line.enTolerancia === 'boolean' ? line.enTolerancia : null,
        calculable: bool(line.calculable),
      };
    }),
    ultimosDespachos: list(row.ultimosDespachos, (item) => {
      const sale = isRecord(item) ? item : {};
      return {
        dispensario: num(sale.dispensario),
        manguera: num(sale.manguera),
        producto: text(sale.producto),
        litros: num(sale.litros),
        importe: num(sale.importe),
        finUtc: text(sale.finUtc),
        folio: text(sale.folio),
      };
    }),
  };
}

function mapAlarma(value: unknown): AlarmaEnOperacion {
  const row = isRecord(value) ? value : {};
  return {
    id: text(row.id) ?? '',
    tipo: text(row.tipo),
    nivel: text(row.nivel),
    texto: text(row.texto),
    inicioUtc: text(row.inicioUtc),
    finUtc: text(row.finUtc),
    reconocida: bool(row.reconocida),
  };
}

function mapContexto(value: unknown): ContextoDeEstaciones {
  const row = isRecord(value) ? value : {};
  return {
    esEquipo: bool(row.esEquipo),
    organizaciones: list(row.organizaciones, (item) => {
      const org = isRecord(item) ? item : {};
      return {
        id: text(org.id) ?? '',
        nombre: text(org.nombre) ?? 'Organización',
        esDemostracion: bool(org.esDemostracion),
        estaciones: list(org.estaciones, (station) => {
          const entry = isRecord(station) ? station : {};
          return { numPermiso: text(entry.numPermiso) ?? '', nombre: text(entry.nombre) ?? 'Estación' };
        }).filter((station) => station.numPermiso),
      };
    }).filter((org) => org.id),
  };
}

async function loadOperacion(orgId: string): Promise<OperacionDeOrganizacion | null> {
  try {
    const payload = await apiGet(`/api/app/estaciones/operacion/${orgId}`);
    const row = isRecord(payload) ? payload : {};
    return {
      organizacionId: text(row.organizacionId) ?? orgId,
      horaUtc: text(row.horaUtc),
      estaciones: list(row.estaciones, mapOperacion),
    };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) return null;
    throw error;
  }
}

export async function fetchInicio(): Promise<Inicio> {
  const [contextoRaw, cuentaRaw, avisosRaw] = await Promise.all([
    apiGet('/api/app/estaciones/contexto'),
    apiGet('/api/app/mi-cuenta').catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 403) return null;
      throw error;
    }),
    apiGet('/api/app/notification?MaxResults=8&OnlyUnread=false').catch(() => []),
  ]);
  const contexto = mapContexto(contextoRaw);
  const operaciones = await Promise.all(contexto.organizaciones.map((org) => loadOperacion(org.id)));
  const estaciones: EstacionVista[] = contexto.organizaciones.flatMap((org, index) => {
    const operacion = operaciones[index];
    return org.estaciones.map((station) => ({
      orgId: org.id,
      orgNombre: org.nombre,
      esDemostracion: org.esDemostracion,
      numPermiso: station.numPermiso,
      nombre: station.nombre,
      operacion: operacion?.estaciones.find((item) => item.numPermiso === station.numPermiso) ?? null,
    }));
  });
  const cuentaRow = isRecord(cuentaRaw) ? cuentaRaw : null;
  const cuenta: MiCuenta | null = cuentaRow
    ? {
        correoConfirmado: bool(cuentaRow.correoConfirmado),
        telefono: text(cuentaRow.telefono),
        segundoFactorActivo: bool(cuentaRow.segundoFactorActivo),
        sesionesActivas: num(cuentaRow.sesionesActivas),
        avisosSinLeer: num(cuentaRow.avisosSinLeer),
        roles: list(cuentaRow.roles, (role) => (typeof role === 'string' ? role : '')).filter(Boolean),
      }
    : null;
  const avisos = list(avisosRaw, (item) => {
    const row = isRecord(item) ? item : {};
    return {
      id: text(row.id) ?? '',
      severity: text(row.severity),
      title: text(row.title),
      body: text(row.body),
      creationTime: text(row.creationTime),
      isRead: bool(row.isRead),
    } satisfies Aviso;
  }).filter((item) => item.id);
  return { esEquipo: contexto.esEquipo, estaciones, cuenta, avisos };
}

export async function fetchEstacion(orgId: string, numPermiso: string): Promise<OperacionDeEstacion | null> {
  const operacion = await loadOperacion(orgId);
  return operacion?.estaciones.find((item) => item.numPermiso === numPermiso) ?? null;
}

export async function reconocerAlarma(alarmaId: string): Promise<void> {
  await apiPost(`/api/app/estaciones/reconocer-alarma/${alarmaId}`);
}

function mapLicencia(value: unknown): Licencia {
  const row = isRecord(value) ? value : {};
  const nodo = isRecord(row.nodo) ? row.nodo : null;
  return {
    id: text(row.id) ?? '',
    organizacion: text(row.organizacion),
    numPermiso: text(row.numPermiso),
    estacion: text(row.estacion),
    estado: (typeof row.estado === 'number' || typeof row.estado === 'string' ? row.estado : null) as Licencia['estado'],
    vigenteHasta: text(row.vigenteHasta),
    activadaEn: text(row.activadaEn),
    configurada: bool(row.configurada),
    nodo: nodo
      ? {
          conectado: bool(nodo.conectado),
          ultimoLatido: text(nodo.ultimoLatido),
          version: text(nodo.version),
          revocado: bool(nodo.revocado),
        }
      : null,
  };
}

export async function fetchLicencias(): Promise<Acceso<PanelDeNodos>> {
  try {
    const payload = await apiGet('/api/app/nodos/panel');
    const row = isRecord(payload) ? payload : {};
    return {
      access: 'ok',
      data: {
        licencias: list(row.licencias, mapLicencia).filter((item) => item.id),
        versionEstable: text(row.versionEstable),
      },
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) return { access: 'denied' };
    throw error;
  }
}

function mapAuditoria(value: unknown): Auditoria {
  const row = isRecord(value) ? value : {};
  return {
    id: text(row.id) ?? '',
    nombreArchivo: text(row.nombreArchivo),
    rfcContribuyente: text(row.rfcContribuyente),
    numPermiso: text(row.numPermiso),
    periodo: text(row.periodo),
    tipoReporte: (typeof row.tipoReporte === 'number' || typeof row.tipoReporte === 'string'
      ? row.tipoReporte
      : null) as Auditoria['tipoReporte'],
    estadoGeneral: (typeof row.estadoGeneral === 'number' || typeof row.estadoGeneral === 'string'
      ? row.estadoGeneral
      : null) as Auditoria['estadoGeneral'],
    productos: num(row.productos),
    hallazgosAltos: num(row.hallazgosAltos),
    hallazgosMedios: num(row.hallazgosMedios),
    creationTime: text(row.creationTime),
    organizacion: text(row.organizacion),
    clasificacion: (typeof row.clasificacion === 'number' || typeof row.clasificacion === 'string'
      ? row.clasificacion
      : null) as Auditoria['clasificacion'],
    pendienteDeConfirmar: bool(row.pendienteDeConfirmar),
  };
}

function mapHallazgo(value: unknown): Hallazgo {
  const row = isRecord(value) ? value : {};
  return {
    codigo: text(row.codigo),
    severidad: (typeof row.severidad === 'number' || typeof row.severidad === 'string'
      ? row.severidad
      : null) as Hallazgo['severidad'],
    titulo: text(row.titulo),
    observacion: text(row.observacion),
    accion: text(row.accion),
  };
}

export async function fetchAuditorias(): Promise<Acceso<Historial>> {
  try {
    const payload = await apiGet(
      '/api/app/auditoria-volumetrica?MaxResultCount=40&SkipCount=0&SoloEquipo=false',
    );
    const row = isRecord(payload) ? payload : {};
    const conteos = isRecord(row.conteos) ? row.conteos : null;
    return {
      access: 'ok',
      data: {
        items: list(row.items, mapAuditoria).filter((item) => item.id),
        totalCount: num(row.totalCount),
        conteos: conteos
          ? {
              todos: num(conteos.todos),
              conErrores: num(conteos.conErrores),
              conObservaciones: num(conteos.conObservaciones),
              sinProblemas: num(conteos.sinProblemas),
            }
          : null,
      },
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) return { access: 'denied' };
    throw error;
  }
}

export async function fetchAuditoria(id: string): Promise<AuditoriaDetalle | null> {
  try {
    const payload = await apiGet(`/api/app/auditoria-volumetrica/${id}`);
    const base = mapAuditoria(payload);
    if (!base.id) return null;
    const row = isRecord(payload) ? payload : {};
    const resultado = isRecord(row.resultado) ? row.resultado : null;
    const productos: ProductoAuditado[] = resultado
      ? list(resultado.productos, (item) => {
          const product = isRecord(item) ? item : {};
          return {
            nombre: text(product.nombre),
            clave: text(product.clave),
            estado: (typeof product.estado === 'number' || typeof product.estado === 'string'
              ? product.estado
              : null) as ProductoAuditado['estado'],
            hallazgos: list(product.hallazgos, mapHallazgo),
          };
        })
      : [];
    return {
      ...base,
      resultado: resultado
        ? {
            estadoTexto: text(resultado.estadoTexto),
            erroresDeSintaxis: num(resultado.erroresDeSintaxis),
            productos,
            hallazgosGenerales: list(resultado.hallazgosGenerales, mapHallazgo),
          }
        : null,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
