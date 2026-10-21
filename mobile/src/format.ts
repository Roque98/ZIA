import type { ClasificacionArchivo, EstadoGeneral, EstadoLicencia } from '@/types';

const LICENCIA: EstadoLicencia[] = [
  'SinClave',
  'PorActivar',
  'Activa',
  'Vencida',
  'Revocada',
  'ClaveCaducada',
];

const ESTADO: EstadoGeneral[] = ['Conforme', 'Precaucion', 'RevisionPrioritaria', 'NoConcluyente'];

const CLASE: ClasificacionArchivo[] = ['SinProblemas', 'ConObservaciones', 'ConErrores'];

const SEVERIDAD = ['Informativa', 'Media', 'Alta'] as const;

const TIPO_REPORTE = ['Desconocido', 'Mensual', 'Diario'] as const;

export function enumName<T extends string>(
  value: T | number | string | null | undefined,
  names: readonly T[],
): T | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return names[value] ?? null;
  return names.find((name) => name === value) ?? null;
}

export function licenciaNombre(value: EstadoLicencia | number | null | undefined): EstadoLicencia | null {
  return enumName(value, LICENCIA);
}

export function licenciaEtiqueta(value: EstadoLicencia | number | null | undefined): string {
  const name = licenciaNombre(value);
  if (name === 'SinClave') return 'Sin clave';
  if (name === 'PorActivar') return 'Por activar';
  if (name === 'Activa') return 'Activa';
  if (name === 'Vencida') return 'Vencida';
  if (name === 'Revocada') return 'Revocada';
  if (name === 'ClaveCaducada') return 'Clave caducada';
  return 'Sin estado';
}

export function estadoNombre(value: EstadoGeneral | number | string | null | undefined): EstadoGeneral | null {
  return enumName(value, ESTADO);
}

export function estadoEtiqueta(value: EstadoGeneral | number | string | null | undefined): string {
  const name = estadoNombre(value);
  if (name === 'Conforme') return 'Conforme';
  if (name === 'Precaucion') return 'Precaución';
  if (name === 'RevisionPrioritaria') return 'Revisión prioritaria';
  if (name === 'NoConcluyente') return 'No concluyente';
  return 'Sin dictamen';
}

export function clasificacionEtiqueta(value: ClasificacionArchivo | number | string | null | undefined): string {
  const name = enumName(value, CLASE);
  if (name === 'SinProblemas') return 'Sin problemas';
  if (name === 'ConObservaciones') return 'Con observaciones';
  if (name === 'ConErrores') return 'Con errores';
  return 'Sin clasificar';
}

export function severidadEtiqueta(value: string | number | null | undefined): string {
  return enumName(value, SEVERIDAD) ?? 'Aviso';
}

export function tipoReporteEtiqueta(value: string | number | null | undefined): string {
  const name = enumName(value, TIPO_REPORTE);
  if (name === 'Mensual') return 'Mensual';
  if (name === 'Diario') return 'Diario';
  return 'Reporte';
}

export function asNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function money(value: number | string | null | undefined): string {
  return asNumber(value).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  });
}

export function liters(value: number | string | null | undefined): string {
  return `${asNumber(value).toLocaleString('es-MX', { maximumFractionDigits: 0 })} L`;
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDay(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function vigenciaEtiqueta(iso: string | null | undefined): string {
  const days = daysUntil(iso);
  if (days == null) return 'Sin fecha de vigencia';
  if (days < -1) return `Venció hace ${Math.abs(days)} días`;
  if (days === -1) return 'Venció ayer';
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  return `Vence en ${days} días · ${formatDay(iso)}`;
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function firstName(name: string): string {
  const part = name.trim().split(/\s+/)[0];
  return part || 'Cliente';
}

export function alarmaAbierta(finUtc: string | null, reconocida: boolean): boolean {
  return !finUtc && !reconocida;
}

export function licenciaPorVencer(estado: EstadoLicencia | number | null, vigenteHasta: string | null): boolean {
  const name = licenciaNombre(estado);
  if (name === 'Vencida' || name === 'ClaveCaducada') return true;
  if (name !== 'Activa') return false;
  const days = daysUntil(vigenteHasta);
  return days != null && days <= 30;
}
