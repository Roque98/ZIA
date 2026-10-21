import { addDays, average } from '@/format';
import type {
  Deadline,
  InspectionPoint,
  RegulatorId,
  RegulatorSnapshot,
  Station,
  Tramite,
} from '@/types';

function regulator(id: RegulatorId, score: number, note: string): RegulatorSnapshot {
  return { id, score, note };
}

function point(
  id: string,
  label: string,
  title: string,
  level: InspectionPoint['level'],
  note: string,
): InspectionPoint {
  return { id, label, title, level, note };
}

function withScore(station: Omit<Station, 'score'>): Station {
  return { ...station, score: average(station.regulators.map((item) => item.score)) };
}

/** Estaciones, trámites y vencimientos de demostración. No son expedientes reales. */
export const stations: Station[] = [
  withScore({
    id: 'costera',
    name: 'Estación Costera',
    city: 'Tijuana',
    state: 'B.C.',
    address: 'Blvd. Díaz Ordaz 1840, La Mesa',
    permit: 'CNE/EXP/ES/DEMO-014',
    regulators: [
      regulator('asea', 58, 'Póliza de responsabilidad civil vencida y COA por vencer.'),
      regulator('cne', 86, 'El reporte trimestral de volumen ya está en gestoría.'),
      regulator('sat', 93, 'Control volumétrico y archivos del mes al corriente.'),
      regulator('stps', 76, 'Estudio de ruido programado; el resto de higiene está vigente.'),
      regulator('pc', 64, 'El protocolo de emergencias no refleja el último análisis de riesgo.'),
    ],
    points: [
      point('hermeticidad', 'Tanques', 'Hermeticidad e integridad', 'atencion', 'La prueba de hermeticidad cumple, pero vence este trimestre.'),
      point('volumetrico', 'Dispensarios', 'Control volumétrico', 'al_dia', 'Dispensarios con NOM-005-SCFI-2017 y medición al día.'),
      point('telemedicion', 'Consola', 'Telemedición', 'al_dia', 'La consola envía JSON al SAT sin rechazos abiertos.'),
      point('videovigilancia', 'Cámaras', 'Videovigilancia', 'al_dia', 'Circuito de monitoreo remoto en operación.'),
      point('electrica', 'Eléctrica', 'NOM-001-SEDE-2012', 'al_dia', 'Verificación eléctrica vigente.'),
      point('seguridad', 'Operación', 'SASISOPA y emergencias', 'riesgo', 'Protocolo de respuesta desactualizado frente al análisis de riesgo.'),
    ],
  }),
  withScore({
    id: 'oriente',
    name: 'Estación Oriente',
    city: 'Orizaba',
    state: 'Ver.',
    address: 'Av. Oriente 6, núm. 420',
    permit: 'CNE/EXP/ES/DEMO-008',
    regulators: [
      regulator('asea', 84, 'SASISOPA vigente. Falta cerrar la evidencia de la última supervisión.'),
      regulator('cne', 88, 'Permiso de expendio en orden. Sin modificaciones abiertas.'),
      regulator('sat', 52, 'El certificado del Anexo 30 está vencido.'),
      regulator('stps', 66, 'La verificación NOM-001 y el estudio de ruido están pendientes.'),
      regulator('pc', 78, 'Programa interno vigente; el simulacro anual aún no se agenda.'),
    ],
    points: [
      point('hermeticidad', 'Tanques', 'Hermeticidad e integridad', 'al_dia', 'Cubicación y hermeticidad dentro de vigencia.'),
      point('volumetrico', 'Dispensarios', 'Control volumétrico', 'atencion', 'Un dispensario tiene sello de verificación por renovar.'),
      point('telemedicion', 'Consola', 'Anexo 30', 'riesgo', 'La consola opera, pero el certificado de seguridad perimetral venció.'),
      point('videovigilancia', 'Cámaras', 'Videovigilancia', 'al_dia', 'Cámaras y grabación con retención completa.'),
      point('electrica', 'Eléctrica', 'NOM-001-SEDE-2012', 'atencion', 'La verificación eléctrica está fuera de vigencia.'),
      point('seguridad', 'Operación', 'Emergencias', 'al_dia', 'Extintores, señalamientos y rutas revisados en la última visita.'),
    ],
  }),
  withScore({
    id: 'reforma',
    name: 'Estación Reforma',
    city: 'Chihuahua',
    state: 'Chih.',
    address: 'Av. Reforma 310, San Felipe',
    permit: 'CNE/EXP/ES/DEMO-021',
    regulators: [
      regulator('asea', 91, 'Cédula de operación anual y licencia de funcionamiento vigentes.'),
      regulator('cne', 72, 'Falta el reporte trimestral y se acerca el de estructura accionaria.'),
      regulator('sat', 74, 'El aviso de funcionamiento del control volumétrico debe actualizarse.'),
      regulator('stps', 94, 'Condiciones de seguridad e higiene al corriente.'),
      regulator('pc', 88, 'Programa interno vigente. El siguiente simulacro está calendarizado.'),
    ],
    points: [
      point('hermeticidad', 'Tanques', 'Hermeticidad e integridad', 'al_dia', 'Tanques con prueba vigente y sin hallazgos de grosor.'),
      point('volumetrico', 'Dispensarios', 'Control volumétrico', 'atencion', 'El aviso de funcionamiento no refleja el alta del dispensario 4.'),
      point('telemedicion', 'Consola', 'Telemedición', 'al_dia', 'Envíos diarios aceptados por el SAT.'),
      point('videovigilancia', 'Cámaras', 'Videovigilancia', 'al_dia', 'Cobertura de isla, tienda y accesos.'),
      point('electrica', 'Eléctrica', 'Instalación eléctrica', 'al_dia', 'Estudio de energía estática y eléctrica vigentes.'),
      point('seguridad', 'Operación', 'Operación', 'al_dia', 'Bitácora de operación al día.'),
    ],
  }),
  withScore({
    id: 'centro',
    name: 'Estación Centro',
    city: 'Culiacán',
    state: 'Sin.',
    address: 'Blvd. Rotarismo 905',
    permit: 'CNE/EXP/ES/DEMO-003',
    regulators: [
      regulator('asea', 96, 'Expediente ASEA completo, incluida la COA de este año.'),
      regulator('cne', 94, 'Permiso y reportes de volumen al corriente.'),
      regulator('sat', 97, 'Control volumétrico certificado y sin diferencias abiertas.'),
      regulator('stps', 93, 'Comisión de seguridad e higiene activa.'),
      regulator('pc', 95, 'Protocolo de emergencias actualizado y dictaminado.'),
    ],
    points: [
      point('hermeticidad', 'Tanques', 'Hermeticidad e integridad', 'al_dia', 'Pruebas no destructivas del año en el expediente.'),
      point('volumetrico', 'Dispensarios', 'Control volumétrico', 'al_dia', 'Medición alineada a la miscelánea fiscal.'),
      point('telemedicion', 'Consola', 'Telemedición y Anexo 30', 'al_dia', 'Certificado Anexo 30 vigente.'),
      point('videovigilancia', 'Cámaras', 'Videovigilancia', 'al_dia', 'Monitoreo remoto con retención de 30 días.'),
      point('electrica', 'Eléctrica', 'Instalación eléctrica', 'al_dia', 'NOM-001 vigente.'),
      point('seguridad', 'Operación', 'SASISOPA', 'al_dia', 'Implementación y evidencia de la última auditoría interna.'),
    ],
  }),
];

export const tramites: Tramite[] = [
  {
    id: 't-poliza',
    stationId: 'costera',
    stationName: 'Estación Costera',
    authority: 'asea',
    title: 'Renovación de póliza de responsabilidad civil',
    reference: 'EXP-ASEA-2041',
    status: 'en_gestoria',
    updatedAt: addDays(-1),
    summary: 'La póliza que ampara la estación venció. Sin ella, el registro ante ASEA queda incompleto.',
    nextAction: 'Comparar las dos coberturas cotizadas y confirmar la contratación.',
    steps: [
      { label: 'Aviso de vencimiento', state: 'hecho', date: addDays(-12) },
      { label: 'Cotización con dos aseguradoras', state: 'hecho', date: addDays(-4) },
      { label: 'Comparación y contratación', state: 'actual' },
      { label: 'Registro de la póliza en el Portal del Regulado', state: 'pendiente' },
    ],
  },
  {
    id: 't-coa',
    stationId: 'costera',
    stationName: 'Estación Costera',
    authority: 'asea',
    title: 'Cédula de Operación Anual',
    reference: 'EXP-ASEA-1988',
    status: 'esperando_autoridad',
    updatedAt: addDays(-6),
    summary: 'La COA ya se ingresó. La estación no debe llegar al vencimiento sin el acuse.',
    nextAction: 'Esperar el acuse de ASEA y responder si piden una prevención.',
    steps: [
      { label: 'Auditoría documental del año', state: 'hecho', date: addDays(-40) },
      { label: 'Integración del expediente', state: 'hecho', date: addDays(-21) },
      { label: 'Ingreso en el Portal del Regulado', state: 'hecho', date: addDays(-9) },
      { label: 'Respuesta de ASEA', state: 'actual' },
      { label: 'Cédula entregada a la estación', state: 'pendiente' },
    ],
  },
  {
    id: 't-trim',
    stationId: 'reforma',
    stationName: 'Estación Reforma',
    authority: 'cne',
    title: 'Reporte trimestral de volumen',
    reference: 'EXP-CNE-3310',
    status: 'en_gestoria',
    updatedAt: addDays(0),
    summary: 'El trimestre cerró y el permiso de expendio exige el reporte antes de la fecha límite.',
    nextAction: 'Conciliar ventas de la consola con el borrador y presentarlo.',
    steps: [
      { label: 'Cierre de lecturas del trimestre', state: 'hecho', date: addDays(-3) },
      { label: 'Conciliación y borrador', state: 'actual' },
      { label: 'Presentación ante CNE', state: 'pendiente' },
      { label: 'Acuse en el expediente', state: 'pendiente' },
    ],
  },
  {
    id: 't-anexo',
    stationId: 'oriente',
    stationName: 'Estación Oriente',
    authority: 'sat',
    title: 'Certificación de seguridad perimetral (Anexo 30)',
    reference: 'EXP-SAT-1174',
    status: 'en_revision',
    updatedAt: addDays(-2),
    summary: 'El certificado venció. El control volumétrico sigue enviando, pero la obligación de seguridad de la red no está cubierta.',
    nextAction: 'Cerrar el inventario de la red y agendar al certificador.',
    steps: [
      { label: 'Diagnóstico de la red de la estación', state: 'hecho', date: addDays(-8) },
      { label: 'Inventario y brechas del Anexo 30', state: 'actual' },
      { label: 'Visita del certificador', state: 'pendiente' },
      { label: 'Certificado y resguardo', state: 'pendiente' },
    ],
  },
  {
    id: 't-proto',
    stationId: 'centro',
    stationName: 'Estación Centro',
    authority: 'pc',
    title: 'Protocolo de respuesta a emergencias',
    reference: 'EXP-PC-0902',
    status: 'listo',
    updatedAt: addDays(-15),
    summary: 'El protocolo quedó actualizado y firmado. La estación ya puede mostrarlo en una inspección.',
    nextAction: 'Conservar el acuse en la carpeta de Protección Civil de la estación.',
    steps: [
      { label: 'Análisis de riesgo actualizado', state: 'hecho', date: addDays(-48) },
      { label: 'Redacción del protocolo', state: 'hecho', date: addDays(-30) },
      { label: 'Visto bueno y firma', state: 'hecho', date: addDays(-15) },
    ],
  },
];

export const deadlines: Deadline[] = [
  {
    id: 'd-poliza',
    stationId: 'costera',
    stationName: 'Estación Costera',
    authority: 'asea',
    title: 'Póliza de responsabilidad civil',
    due: addDays(-9),
    note: 'Vencida. La gestoría de renovación ya tiene cotizaciones.',
    tramiteId: 't-poliza',
  },
  {
    id: 'd-trim',
    stationId: 'reforma',
    stationName: 'Estación Reforma',
    authority: 'cne',
    title: 'Reporte trimestral de volumen',
    due: addDays(6),
    note: 'El borrador está en conciliación con las lecturas de la consola.',
    tramiteId: 't-trim',
  },
  {
    id: 'd-aviso',
    stationId: 'reforma',
    stationName: 'Estación Reforma',
    authority: 'sat',
    title: 'Aviso de funcionamiento del control volumétrico',
    due: addDays(12),
    note: 'Debe incluir el dispensario dado de alta en septiembre.',
  },
  {
    id: 'd-coa',
    stationId: 'costera',
    stationName: 'Estación Costera',
    authority: 'asea',
    title: 'Cédula de Operación Anual',
    due: addDays(18),
    note: 'Ingresada. Falta el acuse de ASEA.',
    tramiteId: 't-coa',
  },
  {
    id: 'd-ruido',
    stationId: 'oriente',
    stationName: 'Estación Oriente',
    authority: 'stps',
    title: 'Estudio de ruido',
    due: addDays(27),
    note: 'La visita de medición está por confirmar con el laboratorio.',
  },
  {
    id: 'd-anexo',
    stationId: 'oriente',
    stationName: 'Estación Oriente',
    authority: 'sat',
    title: 'Certificado Anexo 30',
    due: addDays(-20),
    note: 'Vencido. El diagnóstico de red ya empezó.',
    tramiteId: 't-anexo',
  },
  {
    id: 'd-nom',
    stationId: 'oriente',
    stationName: 'Estación Oriente',
    authority: 'stps',
    title: 'Verificación NOM-001-SEDE-2012',
    due: addDays(41),
    note: 'Instalación eléctrica fuera de vigencia.',
  },
  {
    id: 'd-accionaria',
    stationId: 'centro',
    stationName: 'Estación Centro',
    authority: 'cne',
    title: 'Reporte de estructura accionaria',
    due: addDays(54),
    note: 'Sin cambios societarios reportados. Se prepara la confirmación anual.',
  },
];

export function stationById(id: string): Station | undefined {
  return stations.find((station) => station.id === id);
}

export function tramiteById(id: string): Tramite | undefined {
  return tramites.find((tramite) => tramite.id === id);
}

export function tramitesFor(stationId: string): Tramite[] {
  return tramites.filter((tramite) => tramite.stationId === stationId);
}

export function deadlinesFor(stationId: string): Deadline[] {
  return deadlines
    .filter((deadline) => deadline.stationId === stationId)
    .slice()
    .sort((a, b) => a.due.localeCompare(b.due));
}
