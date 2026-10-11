/* Genera docs/presentacion/presentacion.html: la presentación corporativa de ZIA con la
   estética de la landing (wireframes/bexon). Contenido: docs/client-brief.md.
   La estación y el mapa se toman de la landing para no duplicarlos.

   Uso (desde la raíz del repo):
     node docs/presentacion/generar.js
     chrome --headless=new --no-pdf-header-footer --virtual-time-budget=10000 \
       --print-to-pdf=docs/ZIA-presentacion.pdf docs/presentacion/presentacion.html
*/
const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..', '..');
const bexon = path.join(raiz, 'wireframes', 'bexon');
const landing = fs.readFileSync(path.join(bexon, 'index.html'), 'utf8');
const A = '../../wireframes/bexon/assets';          // assets de la landing, relativos a este HTML
const ICO = k => `${A}/images/zia/icons/${k}.svg`;

// Ilustración de la estación y mapa de oficinas, tal como están en la landing
const estacion = (landing.match(/<div class="zia-station" id="zia-station">\s*(<svg[\s\S]*?<\/svg>)/) || [])[1];
const mapa = (landing.match(/<div class="zia-map"[^>]*>\s*(<svg[\s\S]*?<\/svg>)/) || [])[1];
if (!estacion || !mapa) throw new Error('No se encontró la estación o el mapa en la landing');

const REGS = [
  { k: 'asea', c: '#2f9e6b', n: 'ASEA', full: 'Agencia de Seguridad, Energía y Ambiente', rol: 'Seguridad industrial, operativa y protección ambiental.' },
  { k: 'cre', c: '#d99a1e', n: 'CRE', full: 'Comisión Reguladora de Energía', rol: 'Permisos y reportes de volumen; desarrollo eficiente.' },
  { k: 'sat', c: '#2b6cb0', n: 'SAT', full: 'Servicio de Administración Tributaria', rol: 'Control volumétrico y obligaciones fiscales.' },
  { k: 'stps', c: '#e8742a', n: 'STPS', full: 'Secretaría del Trabajo y Previsión Social', rol: 'Seguridad e higiene laboral.' },
  { k: 'proteccion-civil', c: '#EC3237', n: 'Protección Civil', full: 'Protección Civil', rol: 'Capacidad de respuesta ante emergencias y riesgos.' }
];
const HITOS = [
  { y: '2000', e: 'Orígenes en TI', d: 'Soporte y asesoría en sistemas de información y redes.', r: [] },
  { y: '2004', e: 'Especialización en hidrocarburos', d: 'Controles volumétricos para gasolineras.', r: ['sat'] },
  { y: '2010', e: 'Diversificación en seguridad', d: 'Seguridad e higiene, Protección Civil y STPS.', r: ['stps', 'proteccion-civil'] },
  { y: '2015', e: 'Adaptación regulatoria', d: 'Ampliación del catálogo para CRE y ASEA.', r: ['cre', 'asea'] },
  { y: 'Hoy', e: 'Liderazgo integral', d: 'De la auditoría a la defensoría jurídica.', r: ['asea', 'cre', 'sat', 'stps', 'proteccion-civil'] }
];
const OFICINAS = [
  { o: 'Tijuana', z: 'Baja California', q: 'Mtra. Alma Estrella Domínguez', t: '664 159 4369', m: 'estrella.d@ziaintegracion.com', i: 'AE' },
  { o: 'Chihuahua', z: 'Norte', q: 'Ing. Alejandro Vela', t: '614 471 8727', m: 'a.vela@ziaintegracion.com', i: 'AV' },
  { o: 'Morelia', z: 'Centro', q: 'Ing. Edilberto Brito', t: '443 328 0991', m: 'ebrito@ziaintegracion.com', i: 'EB' },
  { o: 'Orizaba', z: 'Oriente', q: 'Ing. Francisco Santos', t: '272 215 8160', m: 'fco.santos@ziaintegracion.com', i: 'FS' },
  { o: 'Culiacán', z: 'Sinaloa · Próximamente', q: 'Ing. Jaziel Cienfuegos · Ing. Carlos Escalante', t: '', m: '', i: 'JC', soon: true }
];

const chk = '<svg class="chk" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11"/><path d="M6.5 11.5l3 3 6-6.5"/></svg>';
const lista = items => `<ul class="lista">${items.map(t => `<li>${chk}<span>${t}</span></li>`).join('')}</ul>`;
const chip = k => { const r = REGS.find(x => x.k === k); return `<span class="chip" style="--c:${r.c}"><img src="${ICO(k)}" alt="">${r.n}</span>`; };

let n = 0;
const total = 13;
const pagina = (cls, cuerpo) => {
  n += 1;
  const pie = /portada|cierre/.test(cls) ? '' : `
    <footer class="pie"><img src="${A}/images/logos/zia_simbolo.svg" alt=""><span>ZIA Integración · Su aliado estratégico en el sector gasolinero</span><b>${String(n).padStart(2, '0')} / ${total}</b></footer>`;
  return `<section class="pg ${cls}">${cuerpo}${pie}</section>`;
};
const cab = (kicker, titulo, lead) => `
  <header class="cab"><span class="kicker">${kicker}</span><h2>${titulo}</h2>${lead ? `<p class="lead">${lead}</p>` : ''}</header>`;

const paginas = [
  // 1. Portada
  pagina('portada', `
    <div class="portada__marca"><img src="${A}/images/logos/zia_simbolo.svg" alt=""><span>ZIA</span></div>
    <span class="kicker">Su aliado estratégico en el sector gasolinero</span>
    <h1>Una gasolinera.<br>Cinco reguladores.<br><span>Un solo aliado.</span></h1>
    <p class="lead">Más de 20 años poniendo en regla estaciones de servicio ante ASEA, CRE, SAT, STPS y Protección Civil, de la auditoría a la defensa jurídica.</p>
    <div class="portada__regs">${REGS.map(r => `<div class="reg" style="--c:${r.c}"><img src="${ICO(r.k)}" alt=""><b>${r.n === 'Protección Civil' ? 'P. Civil' : r.n}</b></div>`).join('')}</div>
    <div class="portada__pie"><span>Presentación corporativa</span><span>www.ziaintegracion.com</span></div>`),

  // 2. Quiénes somos
  pagina('', `${cab('Quiénes somos', 'El socio clave de las <span>gasolineras en México.</span>')}
    <div class="dos">
      <div>
        <p class="texto">Nuestra misión es ser el socio clave para el éxito y la seguridad de las gasolineras en México, <b>simplificando la complejidad regulatoria y técnica</b> para que nuestros clientes se enfoquen en el crecimiento de su negocio con total tranquilidad.</p>
        <div class="cita"><small>Dirección general</small><b>Ing. Daniel Ponce</b></div>
      </div>
      <div class="cifras">
        <div class="cifra oro"><b>2000</b><span>Año de fundación: más de dos décadas de experiencia</span></div>
        <div class="cifra"><b>5</b><span>Reguladores que atendemos</span></div>
        <div class="cifra"><b>4</b><span>Oficinas regionales, y Culiacán próximamente</span></div>
        <div class="cifra"><b>6</b><span>Líneas de servicio, de la auditoría a la defensoría jurídica</span></div>
      </div>
    </div>`),

  // 3. Trayectoria
  pagina('', `${cab('Trayectoria', 'Crecimos al ritmo <span>de la regulación.</span>', 'Cada etapa sumó a un regulador: hoy acompañamos a su estación ante los cinco.')}
    <div class="linea">${HITOS.map(h => `
      <div class="hito">
        <b class="hito__anio">${h.y}</b><i class="hito__nodo"></i>
        <strong>${h.e}</strong><p>${h.d}</p>
        <div class="hito__regs">${h.r.map(chip).join('')}</div>
      </div>`).join('')}</div>`),

  // 4. Auditoría
  pagina('', `${cab('Servicio 1', 'Auditoría de <span>cumplimiento normativo.</span>', 'La primera línea de defensa de su estación, y la base para diseñar una estrategia de cumplimiento a su medida.')}
    <div class="tres">
      <article class="tarjeta"><span class="num">01</span><h3>Revisión física y técnica</h3><p>Evaluación del equipamiento y las instalaciones de la estación.</p></article>
      <article class="tarjeta"><span class="num">02</span><h3>Análisis documental exhaustivo</h3><p>Verificación de toda la documentación que requieren las autoridades.</p></article>
      <article class="tarjeta"><span class="num">03</span><h3>Ponderación de riesgos</h3><p>Priorización del cumplimiento ante sanciones o clausuras inminentes.</p></article>
    </div>`),

  // 5. Ejes normativos
  pagina('', `${cab('Ejes de cumplimiento', 'Cinco reguladores, <span>un solo aliado.</span>')}
    <div class="ejes">${REGS.map(r => `
      <article class="eje" style="--c:${r.c}"><img src="${ICO(r.k)}" alt=""><h3>${r.n === 'Protección Civil' ? 'P. Civil' : r.n}</h3><small>${r.full}</small><p>${r.rol}</p></article>`).join('')}</div>`),

  // 6. Gestoría
  pagina('', `${cab('Servicio 2', 'Gestoría integral <span>ante autoridades.</span>', 'Usted opera; nosotros tramitamos.')}
    <div class="dos">
      <article class="panel" style="--c:#d99a1e"><h3>${chip('cre')} Ante la CRE</h3>${lista(['Altas y solicitudes de permiso', 'Modificaciones al permiso y cambios de Representante Legal', 'Reportes anuales, diarios y trimestrales', 'Reporte de Estructura Accionaria', 'Regularización de trámites y obligaciones pendientes', 'Sistemas de Gestión de la Medición y NOM-016-CRE-2016'])}</article>
      <article class="panel" style="--c:#2f9e6b"><h3>${chip('asea')} Ante la ASEA</h3>${lista(['Registro en el Portal del Regulado (obtención de CURR)', 'Registro de pólizas de seguros y generador de residuos peligrosos', 'Manifiesto de Impacto Ambiental o Informe Preventivo', 'Análisis de riesgo y Protocolo de Respuesta a Emergencias', 'Licencia de Funcionamiento y Cédula de Operación Anual', 'Elaboración, dictaminación e implementación de SASISOPA'])}</article>
    </div>`),

  // 7. Fiscal y supervisión
  pagina('', `${cab('Servicio 3', 'Servicios fiscales <span>y de supervisión.</span>')}
    <div class="dos">
      <article class="panel" style="--c:#2b6cb0"><h3>${chip('sat')} Cumplimiento SAT</h3>${lista(['Control volumétrico acorde a la Miscelánea Fiscal', 'Seguridad perimetral para la red de datos (Anexo 30)', 'Asistencia fiscal para el aplicativo de controles volumétricos: envío de archivos y certificados JSON o XML', 'Aviso de funcionamiento del control volumétrico'])}</article>
      <article class="panel"><h3>Supervisión y auditoría</h3>${lista(['Supervisión técnica con visitas trimestrales o mensuales', 'Verificación NOM-005-ASEA-2016: diseño, construcción, operación y mantenimiento', 'Verificación NOM-016-CRE-2016 y Anexo 30 certificado', 'Verificación NOM-001-SEDE-2012 de instalaciones eléctricas', 'Estudios de iluminación, ruido y energía estática'])}</article>
    </div>`),

  // 8. Diagnóstico e infraestructura
  pagina('', `${cab('Servicio 4', 'Diagnóstico y mantenimiento <span>de infraestructura.</span>')}
    <div class="dos dos--estacion">
      <div class="estacion">${estacion}</div>
      <div>${lista(['<b>Integridad de tanques.</b> Análisis de integridad y grosor para prevenir fugas.', '<b>Pruebas no destructivas.</b> Hermeticidad, cubicación y ensayos (Anexo 32 del SAT).', '<b>Pruebas de calidad.</b> Laboratorios NOM-016-CRE-2016 y estudios de aguas residuales.', '<b>Análisis documental exhaustivo.</b> Verificación de la documentación ante autoridades.'])}</div>
    </div>`),

  // 9. Equipo tecnológico
  pagina('', `${cab('Servicio 5', 'Suministro de <span>equipo tecnológico.</span>', 'El equipo que su estación necesita para medir, reportar y vigilar conforme a la norma.')}
    <div class="cuatro">
      <article class="tarjeta"><span class="num">01</span><h3>Dispensarios</h3><p>Acordes a la NOM-005-SCFI-2017.</p></article>
      <article class="tarjeta"><span class="num">02</span><h3>Telemedición</h3><p>Consolas de telemedición y jarras patrón.</p></article>
      <article class="tarjeta"><span class="num">03</span><h3>Cómputo y acceso</h3><p>Equipos de cómputo y sistemas de control de acceso.</p></article>
      <article class="tarjeta"><span class="num">04</span><h3>Videovigilancia</h3><p>Sistemas de videovigilancia y monitoreo remoto tipo C4.</p></article>
    </div>`),

  // 10. Defensoría
  pagina('', `${cab('Servicio 6', 'Defensoría jurídica <span>especializada.</span>', 'Cuando la autoridad ya actuó, lo acompañamos hasta resolverlo.')}
    <div class="tres">
      <article class="tarjeta"><span class="num">01</span><h3>Acompañamiento y abogacía</h3><p>Ante SAT, CRE, ASEA, IMSS e INFONAVIT.</p></article>
      <article class="tarjeta"><span class="num">02</span><h3>Juicios contenciosos</h3><p>Juicios Contenciosos Administrativos.</p></article>
      <article class="tarjeta"><span class="num">03</span><h3>Recursos y amparos</h3><p>Recursos de Revisión y Amparos.</p></article>
    </div>`),

  // 11. Cómo trabajamos
  pagina('', `${cab('Cómo trabajamos', 'Así ponemos su estación <span>en regla.</span>')}
    <div class="pasos">
      <article class="paso"><b>01</b><h3>Auditoría inicial</h3><p>Evaluamos el estado real de su gasolinera ante los 5 reguladores. Sin costo y sin compromiso.</p></article>
      <article class="paso"><b>02</b><h3>Estrategia personalizada</h3><p>Diseñamos un plan priorizado según sus riesgos, plazos y el grado de exposición ante cada autoridad.</p></article>
      <article class="paso"><b>03</b><h3>Ejecución y gestoría</h3><p>Tramitamos, auditamos y supervisamos todo el proceso. Usted opera; nosotros gestionamos.</p></article>
      <article class="paso"><b>04</b><h3>Seguimiento continuo</h3><p>Monitoreamos obligaciones periódicas, vencimientos y cambios normativos de forma permanente.</p></article>
    </div>
    <div class="gana"><b>Lo que gana estando en regla</b><span>Opera sin interrupciones</span><span>Inspecciones sin sorpresas</span><span>Permisos siempre al día</span></div>`),

  // 12. Cobertura
  pagina('', `${cab('Cobertura', 'Un especialista <span>cerca de su estación.</span>')}
    <div class="dos dos--mapa">
      <div class="mapa">${mapa}</div>
      <div class="oficinas">${OFICINAS.map(o => `
        <article class="oficina${o.soon ? ' oficina--pronto' : ''}"><i>${o.i}</i><div><b>${o.o} <small>${o.z}</small></b><span>${o.q}</span>${o.t ? `<em>${o.t} · ${o.m}</em>` : ''}</div></article>`).join('')}</div>
    </div>`),

  // 13. Cierre
  pagina('cierre', `
    <span class="kicker">Diagnóstico sin costo</span>
    <h1>Hablemos antes de que llegue <span>la inspección.</span></h1>
    <p class="lead">Cuéntenos qué le preocupa y le asignamos al especialista de su región.</p>
    <div class="contactos">
      <div><small>Línea principal</small><b>664 159 4369</b></div>
      <div><small>Correo</small><b>contacto@ziaintegracion.com</b></div>
      <div><small>Sitio web</small><b>www.ziaintegracion.com</b></div>
    </div>
    <div class="cierre__marca"><img src="${A}/images/logos/zia_simbolo.svg" alt=""><span>ZIA</span><em>Integración · Seguridad y tecnología</em></div>`)
];

const css = `
@import url("https://fonts.googleapis.com/css2?family=Mona+Sans:wght@400;500;600;700;800;900&display=swap");
@page { size: 1280px 720px; margin: 0; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
:root { --ink:#0c1e21; --teal:#1e8a8a; --teal2:#4fd1c5; --gold:#A69140; --red:#EC3237; }
html, body { margin: 0; padding: 0; background: var(--ink); font-family: 'Mona Sans', 'Segoe UI', Arial, sans-serif; color: #fff; }
.pg { position: relative; width: 1280px; height: 720px; padding: 58px 72px 64px; overflow: hidden; page-break-after: always; break-after: page;
  background: radial-gradient(900px 560px at 78% 34%, rgba(30,138,138,.20), transparent 70%), var(--ink); }
.pg::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .5;
  background-image: radial-gradient(rgba(30,138,138,.34) 1.3px, transparent 1.5px); background-size: 30px 30px; }
.pg > * { position: relative; }
/* Encabezado arriba y el cuerpo centrado en el espacio restante */
.pg:not(.portada):not(.cierre) { display: flex; flex-direction: column; }
.pg:not(.portada):not(.cierre) > .cab { flex: 0 0 auto; margin-bottom: 0; }
.pg:not(.portada):not(.cierre) > .cab + * { margin-top: auto; margin-bottom: auto; }
.pg:not(.portada):not(.cierre) > .gana { margin-top: 0; margin-bottom: auto; }
.pg:not(.portada):not(.cierre) > .pasos { margin-bottom: 22px; }
.pg:last-child { page-break-after: auto; break-after: auto; }
.kicker { display: block; font-size: 13px; font-weight: 800; letter-spacing: .22em; text-transform: uppercase; color: var(--teal2); margin-bottom: 14px; }
h1 { font-size: 66px; font-weight: 900; line-height: 1.02; letter-spacing: -.025em; margin: 0 0 22px; }
h2 { font-size: 46px; font-weight: 900; line-height: 1.05; letter-spacing: -.02em; margin: 0; }
h1 span, h2 span { color: var(--teal2); }
h3 { font-size: 21px; font-weight: 900; line-height: 1.25; margin: 0 0 8px; }
.lead { font-size: 19px; line-height: 1.55; color: rgba(255,255,255,.72); margin: 12px 0 0; max-width: 820px; }
.cab { margin-bottom: 34px; }
.pie { position: absolute; left: 72px; right: 72px; bottom: 24px; display: flex; align-items: center; gap: 10px; font-size: 11.5px; color: rgba(255,255,255,.45); border-top: 1px solid rgba(255,255,255,.1); padding-top: 12px; }
.pie img { width: 18px; height: 18px; }
.pie b { margin-left: auto; font-weight: 800; letter-spacing: .08em; color: rgba(255,255,255,.6); }
.dos { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start; }
.tres { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.cuatro { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.texto { font-size: 21px; line-height: 1.6; color: rgba(255,255,255,.8); margin: 0 0 26px; }
.texto b { color: #fff; }
.tarjeta, .panel, .cifra, .eje, .paso, .oficina { background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; }
.tarjeta { position: relative; padding: 28px 26px 30px; overflow: hidden; min-height: 210px; }
.tarjeta::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--teal), var(--gold)); }
.tarjeta .num { display: block; font-size: 15px; font-weight: 900; letter-spacing: .14em; color: var(--teal2); margin-bottom: 18px; }
.tarjeta p, .eje p, .paso p { margin: 0; font-size: 16px; line-height: 1.55; color: rgba(255,255,255,.7); }
.panel { padding: 24px 26px 26px; border-top: 3px solid var(--c, var(--teal)); }
.panel h3 { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 11px; }
.lista li { display: grid; grid-template-columns: 22px 1fr; gap: 11px; align-items: start; font-size: 16px; line-height: 1.45; color: rgba(255,255,255,.86); }
.lista b { color: #fff; }
.chk { width: 22px; height: 22px; }
.chk circle { fill: color-mix(in srgb, var(--c, var(--teal)) 26%, transparent); }
.chk path { fill: none; stroke: var(--teal2); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.chip { display: inline-flex; align-items: center; gap: 7px; padding: 3px 11px 3px 3px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #fff;
  background: color-mix(in srgb, var(--c) 20%, transparent); border: 1px solid color-mix(in srgb, var(--c) 60%, transparent); }
.chip img { width: 22px; height: 22px; border-radius: 50%; background: #fff; }

/* Portada y cierre */
.portada, .cierre { padding: 64px 80px; background: radial-gradient(1000px 640px at 84% 26%, rgba(30,138,138,.30), transparent 68%), var(--ink); }
.portada__marca, .cierre__marca { display: flex; align-items: center; gap: 12px; }
.portada__marca { margin-bottom: 74px; }
.portada__marca img, .cierre__marca img { width: 44px; height: 44px; }
.portada__marca span, .cierre__marca span { font-size: 30px; font-weight: 900; letter-spacing: 6px; color: var(--teal2); }
.portada .lead { max-width: 640px; }
.portada__regs { display: flex; gap: 34px; margin-top: 46px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,.12); max-width: 760px; }
.reg { display: flex; align-items: center; gap: 10px; }
.reg img { width: 40px; height: 40px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 30%, transparent); }
.reg b { font-size: 14px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; }
.portada__pie { position: absolute; left: 80px; right: 80px; bottom: 34px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.5); }
.cierre { display: flex; flex-direction: column; justify-content: center; }
.cierre h1 { max-width: 900px; }
.contactos { display: flex; gap: 18px; margin-top: 40px; }
.contactos div { padding: 18px 24px; border-radius: 14px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); }
.contactos small { display: block; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--teal2); margin-bottom: 4px; }
.contactos b { font-size: 21px; font-weight: 800; }
.cierre__marca { position: absolute; left: 80px; bottom: 40px; }
.cierre__marca em { font-style: normal; font-size: 12px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.5); margin-left: 10px; }

/* Quiénes somos */
.cita { display: inline-block; padding: 16px 22px; border-radius: 14px; background: linear-gradient(120deg, rgba(166,145,64,.22), rgba(30,138,138,.12)); border: 1px solid rgba(166,145,64,.45); }
.cita small { display: block; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); }
.cita b { font-size: 22px; }
.cifras { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.cifra { padding: 22px 24px; }
.cifra b { display: block; font-size: 54px; font-weight: 900; line-height: 1; color: var(--teal2); margin-bottom: 8px; }
.cifra.oro b { color: var(--gold); }
.cifra span { font-size: 14.5px; line-height: 1.45; color: rgba(255,255,255,.72); }

/* Trayectoria */
.linea { position: relative; display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-top: 10px; }
.linea::before { content: ""; position: absolute; left: 4%; right: 4%; top: 79px; height: 3px; border-radius: 3px; background: linear-gradient(90deg, var(--teal), var(--teal2)); }
.hito { position: relative; text-align: center; padding: 0 6px; }
.hito__anio { display: block; font-size: 46px; font-weight: 900; line-height: 1; color: var(--gold); letter-spacing: -.02em; height: 60px; }
.hito__nodo { display: block; width: 18px; height: 18px; margin: 10px auto 22px; border-radius: 50%; background: var(--teal2); box-shadow: 0 0 0 6px rgba(79,209,197,.2); }
.hito strong { display: block; font-size: 18px; font-weight: 900; line-height: 1.25; margin-bottom: 8px; }
.hito p { margin: 0 0 14px; font-size: 14.5px; line-height: 1.5; color: rgba(255,255,255,.68); }
.hito__regs { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.hito__regs .chip { font-size: 10.5px; padding: 2px 9px 2px 2px; }
.hito__regs .chip img { width: 18px; height: 18px; }

/* Ejes */
.ejes { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
.eje { padding: 26px 20px; border-top: 3px solid var(--c); text-align: left; min-height: 300px; }
.eje img { width: 64px; height: 64px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 5px color-mix(in srgb, var(--c) 30%, transparent); margin-bottom: 20px; }
.eje h3 { font-size: 24px; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 4px; }
.eje small { display: block; font-size: 12.5px; line-height: 1.4; color: color-mix(in srgb, var(--c) 55%, #fff); min-height: 36px; margin-bottom: 12px; }
.eje p { font-size: 14.5px; }

/* Estación (misma ilustración de la landing) */
.dos--estacion { grid-template-columns: 1.35fr 1fr; align-items: center; }
.estacion { background: #fff; border-radius: 18px; padding: 10px; box-shadow: 0 30px 70px rgba(0,0,0,.4); }
.estacion svg { display: block; width: 100%; height: auto; border-radius: 12px; }
.estacion .ln { stroke: #0c1e21; stroke-width: 3; } .estacion .lt { stroke: #0c1e21; stroke-width: 2; }
.estacion .tl { fill: #d8e5e5; } .estacion .tm { fill: #1e8a8a; } .estacion .wh { fill: #fff; } .estacion .gd { fill: #A69140; }
.estacion .dash { stroke: #1e8a8a; stroke-width: 2.5; stroke-dasharray: 6 8; }
.estacion .pt { fill: #EC3237; stroke: #fff; stroke-width: 3; }

/* Pasos */
.pasos { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.paso { padding: 24px 22px 26px; }
.paso b { display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 50%; background: var(--teal); font-size: 15px; font-weight: 900; margin-bottom: 18px; box-shadow: 0 0 0 6px rgba(30,138,138,.22); }
.paso p { font-size: 15px; }
.gana { margin-top: 24px; display: flex; align-items: center; gap: 12px; padding: 16px 22px; border-radius: 14px; border: 1px dashed rgba(79,209,197,.5); background: rgba(30,138,138,.1); }
.gana b { font-size: 12px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; color: var(--teal2); margin-right: 8px; }
.gana span { font-size: 15.5px; font-weight: 800; padding: 6px 14px; border-radius: 20px; background: rgba(255,255,255,.07); }

/* Cobertura */
.dos--mapa { grid-template-columns: 1fr 1.05fr; align-items: center; gap: 30px; }
.mapa svg { display: block; width: 100%; height: auto; overflow: visible; }
.zia-map__dots { stroke: var(--teal2); stroke-width: 6.5; stroke-linecap: round; fill: none; opacity: .5; }
.zia-map__pulse { fill: var(--teal2); opacity: .2; }
.zia-map__core { fill: var(--teal); stroke: #fff; stroke-width: 4; }
.zia-map__lbl { font: 800 26px/1 'Mona Sans', sans-serif; fill: #fff; paint-order: stroke; stroke: var(--ink); stroke-width: 7px; stroke-linejoin: round; }
.zia-map__pin--soon .zia-map__core { fill: #fff; stroke: var(--gold); stroke-dasharray: 5 4; }
.zia-map__pin--soon .zia-map__pulse { fill: var(--gold); }
.oficinas { display: grid; gap: 9px; }
.oficina { display: grid; grid-template-columns: 44px 1fr; gap: 14px; align-items: center; padding: 11px 16px; }
.oficina i { width: 44px; height: 44px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-style: normal; font-size: 14px; font-weight: 900; background: linear-gradient(135deg, var(--teal), #14403f); box-shadow: inset 0 0 0 2px rgba(255,255,255,.18); }
.oficina--pronto i { background: linear-gradient(135deg, var(--gold), #6e5f24); }
.oficina b { display: block; font-size: 16.5px; font-weight: 900; }
.oficina b small { font-size: 11.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--teal2); margin-left: 6px; }
.oficina--pronto b small { color: var(--gold); }
.oficina span { display: block; font-size: 14px; color: rgba(255,255,255,.85); }
.oficina em { display: block; font-style: normal; font-size: 12.5px; color: rgba(255,255,255,.55); }
`;

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>ZIA Integración — Presentación corporativa</title>
<style>${css}</style>
</head>
<body>
${paginas.join('\n')}
</body>
</html>
`;

if (n !== total) throw new Error(`Se generaron ${n} páginas pero el pie dice ${total}: actualizar 'total'`);
const salida = path.join(__dirname, 'presentacion.html');
fs.writeFileSync(salida, html);
console.log(`OK: ${n} páginas -> ${path.relative(raiz, salida)}`);
