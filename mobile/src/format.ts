import type { Level, RegulatorId, TramiteStatus } from '@/types';

export function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDay(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseDay(iso);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function formatDate(iso: string): string {
  return parseDay(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function dueLabel(iso: string): string {
  const days = daysUntil(iso);
  if (days < -1) return `Venció hace ${Math.abs(days)} días`;
  if (days === -1) return 'Venció ayer';
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  return `Vence en ${days} días`;
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function levelFor(score: number): Level {
  if (score >= 90) return 'al_dia';
  if (score >= 70) return 'atencion';
  return 'riesgo';
}

export function levelLabel(level: Level): string {
  if (level === 'al_dia') return 'Al día';
  if (level === 'atencion') return 'Atención';
  return 'Riesgo';
}

export function statusLabel(status: TramiteStatus): string {
  if (status === 'en_revision') return 'En revisión';
  if (status === 'en_gestoria') return 'En gestoría';
  if (status === 'esperando_autoridad') return 'En autoridad';
  return 'Listo';
}

export const REGULATOR_ORDER: RegulatorId[] = ['asea', 'cne', 'sat', 'stps', 'pc'];

export const REGULATORS: Record<
  RegulatorId,
  { abbr: string; name: string; short: string; color: string }
> = {
  asea: {
    abbr: 'ASEA',
    name: 'Agencia de Seguridad, Energía y Ambiente',
    short: 'Seguridad y ambiente',
    color: '#2f9e6b',
  },
  cne: {
    abbr: 'CNE',
    name: 'Comisión Nacional de Energía',
    short: 'Permisos y volumen',
    color: '#d99a1e',
  },
  sat: {
    abbr: 'SAT',
    name: 'Servicio de Administración Tributaria',
    short: 'Control volumétrico',
    color: '#2b6cb0',
  },
  stps: {
    abbr: 'STPS',
    name: 'Secretaría del Trabajo y Previsión Social',
    short: 'Seguridad laboral',
    color: '#e8742a',
  },
  pc: {
    abbr: 'P. Civil',
    name: 'Protección Civil',
    short: 'Emergencias',
    color: '#EC3237',
  },
};
