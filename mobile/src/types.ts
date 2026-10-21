export type RegulatorId = 'asea' | 'cne' | 'sat' | 'stps' | 'pc';

export type Level = 'al_dia' | 'atencion' | 'riesgo';

export type TramiteStatus = 'en_revision' | 'en_gestoria' | 'esperando_autoridad' | 'listo';

export type StepState = 'hecho' | 'actual' | 'pendiente';

export type SessionUser = {
  id: string;
  name: string;
  firstName: string;
  email: string;
  role: string;
  company: string;
  office: string;
  phone: string;
};

export type Session = {
  token: string;
  source: 'mock' | 'api';
  user: SessionUser;
};

export type RegulatorSnapshot = {
  id: RegulatorId;
  score: number;
  note: string;
};

export type InspectionPoint = {
  id: string;
  label: string;
  title: string;
  level: Level;
  note: string;
};

export type Station = {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  permit: string;
  score: number;
  regulators: RegulatorSnapshot[];
  points: InspectionPoint[];
};

export type TramiteStep = {
  label: string;
  state: StepState;
  date?: string;
};

export type Tramite = {
  id: string;
  stationId: string;
  stationName: string;
  authority: RegulatorId;
  title: string;
  reference: string;
  status: TramiteStatus;
  updatedAt: string;
  summary: string;
  nextAction: string;
  steps: TramiteStep[];
};

export type Deadline = {
  id: string;
  stationId: string;
  stationName: string;
  authority: RegulatorId;
  title: string;
  due: string;
  note: string;
  tramiteId?: string;
};

export type DashboardData = {
  stations: Station[];
  tramites: Tramite[];
  deadlines: Deadline[];
};
