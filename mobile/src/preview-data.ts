/**
 * Datos ficticios solo para capturas de la ficha de Play.
 * Se activan con EXPO_PUBLIC_STORE_PREVIEW=1. El AAB de producción se arma sin esa variable,
 * así que estas respuestas no se usan en la app que se sube a Google Play.
 */
export const STORE_PREVIEW = process.env.EXPO_PUBLIC_STORE_PREVIEW === '1';

const ORG = '00000000-0000-4000-8000-000000000001';
const AUDIT = '00000000-0000-4000-8000-0000000000a1';

const contexto = {
  esEquipo: false,
  organizaciones: [
    {
      id: ORG,
      nombre: 'Grupo Ejemplo',
      esDemostracion: true,
      estaciones: [
        { numPermiso: 'PL/000/EXP/ES/2024', nombre: 'Estación Ejemplo Norte' },
        { numPermiso: 'PL/000/EXP/ES/2025', nombre: 'Estación Ejemplo Centro' },
      ],
    },
  ],
};

function estacion(permiso: string, nombre: string, enLinea: boolean) {
  return {
    numPermiso: permiso,
    nombre,
    nodo: {
      conectado: enLinea,
      ultimoLatido: '2026-10-21T14:05:00Z',
      version: '1.4.2',
      plataforma: 'linux',
      nombreDeEquipo: 'nodo-ejemplo',
    },
    configurada: true,
    dia: '2026-10-21',
    ventas: { litros: enLinea ? 18420 : 0, importe: enLinea ? 428500 : 0, despachos: enLinea ? 312 : 0, litrosPorHora: [], horaLocal: 14 },
    tanques: [
      { numero: 1, producto: 'Premium', capacidad: 40000, volumen: 26500, altura: 1400, agua: 0, temperatura: 24.5 },
      { numero: 2, producto: 'Regular', capacidad: 60000, volumen: 9100, altura: 620, agua: 12, temperatura: 25.1 },
    ],
    dispensarios: [
      { numero: 1, estado: 'En servicio', producto: 'Regular', litros: 6400, importe: 148000, ultimoDespachoUtc: '2026-10-21T13:58:00Z' },
      { numero: 2, estado: 'En servicio', producto: 'Premium', litros: 4100, importe: 112000, ultimoDespachoUtc: '2026-10-21T13:51:00Z' },
    ],
    alarmas: enLinea
      ? [
          {
            id: '00000000-0000-4000-8000-0000000000b1',
            tipo: 'agua',
            nivel: 'Media',
            texto: 'Ejemplo: agua por encima del umbral en el tanque 2',
            inicioUtc: '2026-10-21T11:20:00Z',
            finUtc: null,
            reconocida: false,
          },
        ]
      : [],
    balance: [
      {
        producto: 'Regular',
        diferenciaLitros: -42,
        diferenciaPorcentaje: -0.18,
        enTolerancia: true,
        calculable: true,
      },
    ],
    ultimosDespachos: [
      { dispensario: 1, manguera: 2, producto: 'Regular', litros: 22.4, importe: 518, finUtc: '2026-10-21T13:58:00Z', folio: 'EJ-1001' },
      { dispensario: 2, manguera: 1, producto: 'Premium', litros: 18.1, importe: 496, finUtc: '2026-10-21T13:51:00Z', folio: 'EJ-1002' },
    ],
  };
}

const operacion = {
  organizacionId: ORG,
  horaUtc: '2026-10-21T14:06:00Z',
  estaciones: [
    estacion('PL/000/EXP/ES/2024', 'Estación Ejemplo Norte', true),
    estacion('PL/000/EXP/ES/2025', 'Estación Ejemplo Centro', false),
  ],
};

const auditoria = {
  id: AUDIT,
  nombreArchivo: 'ejemplo-octubre-2026.xml',
  rfcContribuyente: 'XAXX010101000',
  numPermiso: 'PL/000/EXP/ES/2024',
  periodo: '2026-10',
  tipoReporte: 'Mensual',
  estadoGeneral: 'Precaucion',
  productos: 2,
  hallazgosAltos: 1,
  hallazgosMedios: 1,
  creationTime: '2026-10-18T16:00:00Z',
  organizacion: 'Grupo Ejemplo',
  clasificacion: 'ConObservaciones',
  pendienteDeConfirmar: false,
  resultado: {
    estadoTexto: 'Ejemplo de dictamen: hay una observación de inventario y un hallazgo de bitácora.',
    erroresDeSintaxis: 0,
    productos: [
      {
        nombre: 'Regular',
        clave: '32011',
        estado: 'Precaucion',
        hallazgos: [
          {
            codigo: 'EJ-01',
            severidad: 'Media',
            titulo: 'Diferencia de ejemplo en el inventario',
            observacion: 'Texto de muestra. No corresponde a un contribuyente real.',
            accion: 'Revisar la recepción del día 12 en la consola.',
          },
        ],
      },
    ],
    hallazgosGenerales: [
      {
        codigo: 'EJ-02',
        severidad: 'Alta',
        titulo: 'Bitácora de ejemplo incompleta',
        observacion: 'Falta un evento de calibración en este archivo de muestra.',
        accion: 'Completar el evento antes de enviar el reporte.',
      },
    ],
  },
};

export function previewGet(path: string): unknown {
  if (path.startsWith('/api/app/estaciones/contexto')) return contexto;
  if (path.includes('/api/app/estaciones/operacion/')) return operacion;
  if (path.startsWith('/api/app/mi-cuenta')) {
    return {
      correoConfirmado: true,
      telefono: null,
      segundoFactorActivo: false,
      sesionesActivas: 1,
      avisosSinLeer: 1,
      roles: ['Cliente'],
    };
  }
  if (path.startsWith('/api/app/notification')) {
    return [
      {
        id: '00000000-0000-4000-8000-0000000000c1',
        severity: 'info',
        title: 'Aviso de ejemplo',
        body: 'Esta notificación es ficticia y solo aparece en las capturas de la tienda.',
        creationTime: '2026-10-21T09:00:00Z',
        isRead: false,
      },
    ];
  }
  if (path.startsWith('/api/app/nodos/panel')) {
    return {
      versionEstable: '1.4.2',
      licencias: [
        {
          id: '00000000-0000-4000-8000-0000000000d1',
          organizacion: 'Grupo Ejemplo',
          numPermiso: 'PL/000/EXP/ES/2024',
          estacion: 'Estación Ejemplo Norte',
          estado: 'Activa',
          vigenteHasta: '2026-11-02T00:00:00Z',
          activadaEn: '2026-01-15T00:00:00Z',
          configurada: true,
          nodo: { conectado: true, ultimoLatido: '2026-10-21T14:05:00Z', version: '1.4.2', revocado: false },
        },
        {
          id: '00000000-0000-4000-8000-0000000000d2',
          organizacion: 'Grupo Ejemplo',
          numPermiso: 'PL/000/EXP/ES/2025',
          estacion: 'Estación Ejemplo Centro',
          estado: 'Vencida',
          vigenteHasta: '2026-09-01T00:00:00Z',
          activadaEn: '2025-09-01T00:00:00Z',
          configurada: true,
          nodo: { conectado: false, ultimoLatido: '2026-10-19T22:10:00Z', version: '1.3.0', revocado: false },
        },
      ],
    };
  }
  if (path.startsWith(`/api/app/auditoria-volumetrica/${AUDIT}`)) return auditoria;
  if (path.startsWith('/api/app/auditoria-volumetrica')) {
    return {
      totalCount: 1,
      conteos: { todos: 1, conErrores: 0, conObservaciones: 1, sinProblemas: 0 },
      items: [auditoria],
    };
  }
  return null;
}
