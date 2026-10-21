export type SessionUser = {
  id: string;
  name: string;
  email: string;
  userName: string;
  roles: string[];
};

export type Session = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  user: SessionUser;
  organization: string | null;
};

export type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

export type EstacionResumen = {
  numPermiso: string;
  nombre: string;
};

export type OrganizacionContexto = {
  id: string;
  nombre: string;
  esDemostracion: boolean;
  estaciones: EstacionResumen[];
};

export type ContextoDeEstaciones = {
  esEquipo: boolean;
  organizaciones: OrganizacionContexto[];
};

export type NodoEnOperacion = {
  conectado: boolean;
  ultimoLatido: string | null;
  version: string | null;
  plataforma: string | null;
  nombreDeEquipo: string | null;
};

export type VentasDelDia = {
  litros: number;
  importe: number;
  despachos: number;
  litrosPorHora: number[];
  horaLocal: number;
};

export type TanqueEnOperacion = {
  numero: number;
  producto: string | null;
  capacidad: number;
  volumen: number | null;
  altura: number | null;
  agua: number | null;
  temperatura: number | null;
};

export type DispensarioEnOperacion = {
  numero: number;
  estado: string | null;
  producto: string | null;
  litros: number;
  importe: number;
  ultimoDespachoUtc: string | null;
};

export type AlarmaEnOperacion = {
  id: string;
  tipo: string | null;
  nivel: string | null;
  texto: string | null;
  inicioUtc: string | null;
  finUtc: string | null;
  reconocida: boolean;
};

export type BalanceEnOperacion = {
  producto: string | null;
  diferenciaLitros: number;
  diferenciaPorcentaje: number | null;
  enTolerancia: boolean | null;
  calculable: boolean;
};

export type DespachoEnOperacion = {
  dispensario: number;
  manguera: number;
  producto: string | null;
  litros: number;
  importe: number;
  finUtc: string | null;
  folio: string | null;
};

export type OperacionDeEstacion = {
  numPermiso: string;
  nombre: string | null;
  nodo: NodoEnOperacion | null;
  configurada: boolean;
  dia: string | null;
  ventas: VentasDelDia | null;
  tanques: TanqueEnOperacion[];
  dispensarios: DispensarioEnOperacion[];
  alarmas: AlarmaEnOperacion[];
  balance: BalanceEnOperacion[];
  ultimosDespachos: DespachoEnOperacion[];
};

export type OperacionDeOrganizacion = {
  organizacionId: string;
  horaUtc: string | null;
  estaciones: OperacionDeEstacion[];
};

export type EstacionVista = {
  orgId: string;
  orgNombre: string;
  esDemostracion: boolean;
  numPermiso: string;
  nombre: string;
  operacion: OperacionDeEstacion | null;
};

export type MiCuenta = {
  correoConfirmado: boolean;
  telefono: string | null;
  segundoFactorActivo: boolean;
  sesionesActivas: number;
  avisosSinLeer: number;
  roles: string[];
};

export type Aviso = {
  id: string;
  severity: string | null;
  title: string | null;
  body: string | null;
  creationTime: string | null;
  isRead: boolean;
};

export type Inicio = {
  esEquipo: boolean;
  estaciones: EstacionVista[];
  cuenta: MiCuenta | null;
  avisos: Aviso[];
};

export type EstadoLicencia =
  | 'SinClave'
  | 'PorActivar'
  | 'Activa'
  | 'Vencida'
  | 'Revocada'
  | 'ClaveCaducada';

export type Licencia = {
  id: string;
  organizacion: string | null;
  numPermiso: string | null;
  estacion: string | null;
  estado: EstadoLicencia | number | null;
  vigenteHasta: string | null;
  activadaEn: string | null;
  configurada: boolean;
  nodo: {
    conectado: boolean;
    ultimoLatido: string | null;
    version: string | null;
    revocado: boolean;
  } | null;
};

export type PanelDeNodos = {
  licencias: Licencia[];
  versionEstable: string | null;
};

export type Acceso<T> = { access: 'ok'; data: T } | { access: 'denied' };

export type EstadoGeneral = 'Conforme' | 'Precaucion' | 'RevisionPrioritaria' | 'NoConcluyente';

export type ClasificacionArchivo = 'SinProblemas' | 'ConObservaciones' | 'ConErrores';

export type Auditoria = {
  id: string;
  nombreArchivo: string | null;
  rfcContribuyente: string | null;
  numPermiso: string | null;
  periodo: string | null;
  tipoReporte: string | number | null;
  estadoGeneral: EstadoGeneral | number | null;
  productos: number;
  hallazgosAltos: number;
  hallazgosMedios: number;
  creationTime: string | null;
  organizacion: string | null;
  clasificacion: ClasificacionArchivo | number | null;
  pendienteDeConfirmar: boolean;
};

export type Historial = {
  items: Auditoria[];
  totalCount: number;
  conteos: {
    todos: number;
    conErrores: number;
    conObservaciones: number;
    sinProblemas: number;
  } | null;
};

export type Hallazgo = {
  codigo: string | null;
  severidad: string | number | null;
  titulo: string | null;
  observacion: string | null;
  accion: string | null;
};

export type ProductoAuditado = {
  nombre: string | null;
  clave: string | null;
  estado: EstadoGeneral | number | null;
  hallazgos: Hallazgo[];
};

export type AuditoriaDetalle = Auditoria & {
  resultado: {
    estadoTexto: string | null;
    erroresDeSintaxis: number;
    productos: ProductoAuditado[];
    hallazgosGenerales: Hallazgo[];
  } | null;
};
