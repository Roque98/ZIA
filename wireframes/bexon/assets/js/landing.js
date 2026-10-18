/* ═══════════════════════════════════════════════════
   ZIA — Landing única (wireframes/bexon/index.html)
   Reúne lo que antes vivía en home, servicios, nosotros y contacto.
   Cada módulo es independiente: si su marcado no existe, no hace nada.
═══════════════════════════════════════════════════ */

/* ── Rendimiento: lo que no se ve no se anima ──
   Cada sección fuera de pantalla recibe .is-offscreen (landing.css pausa ahí las animaciones
   CSS infinitas: anillos, pulsos, flujo de datos, órbita) y el video del hero se pausa. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { en.target.classList.toggle('is-offscreen', !en.isIntersecting); });
  }, { rootMargin: '80px 0px' });
  document.querySelectorAll('main .zia-sec').forEach(function (s) { io.observe(s); });

  var video = document.querySelector('.zia-lp-video video');
  if (video) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
        else video.pause();
      });
    }, { threshold: .1 }).observe(video);
  }
}());

/* ── Estación interactiva (el enlace del detalle pre-llena el formulario) ── */
(function () {
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Estación: puntos de inspección ── */
  var PUNTOS = {
    hermeticidad:    { k: 'Tanques',             t: 'Hermeticidad e integridad',  d: 'Pruebas no destructivas, cubicación y grosor de pared para prevenir fugas.', tema: 'ASEA' },
    volumetrico:     { k: 'Dispensarios',        t: 'Control volumétrico',        d: 'Medición conforme a la Miscelánea Fiscal y dispensarios NOM-005-SCFI-2017.', tema: 'SAT' },
    telemedicion:    { k: 'Consola',             t: 'Telemedición y Anexo 30',    d: 'Consolas, archivos JSON/XML al SAT y seguridad perimetral de la red.', tema: 'SAT' },
    videovigilancia: { k: 'Cámaras',             t: 'Videovigilancia tipo C4',    d: 'Monitoreo remoto y control de acceso.', tema: 'No estoy seguro' },
    electrica:       { k: 'Instalación eléctrica', l: 'Eléctrica', t: 'NOM-001-SEDE-2012', d: 'Verificación eléctrica, iluminación, ruido y energía estática.', tema: 'STPS' },
    seguridad:       { k: 'Operación',           t: 'SASISOPA y emergencias',     d: 'Análisis de riesgo, protocolo de respuesta y licencia de funcionamiento.', tema: 'ASEA,Protección Civil' }
  };
  var station = document.getElementById('zia-station');
  if (station) {
    var svg = station.querySelector('svg');
    // El detalle vive en un panel fuera del diagrama para no tapar la ilustración
    var tip = document.querySelector('#estacion .zia-station__tip');
    var SVGNS = 'http://www.w3.org/2000/svg';
    var legend = document.querySelectorAll('.zia-station__legend button');
    var ids = Object.keys(PUNTOS);
    var current = null, timer = null, userTook = false;

    // Anillo pulsante detrás de cada punto
    svg.querySelectorAll('.pt').forEach(function (pt) {
      var ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('class', 'pt-ring');
      ring.setAttribute('cx', pt.getAttribute('cx'));
      ring.setAttribute('cy', pt.getAttribute('cy'));
      ring.setAttribute('r', pt.getAttribute('r'));
      pt.parentNode.insertBefore(ring, pt);
      pt.setAttribute('tabindex', '0');
      pt.setAttribute('role', 'button');
      pt.setAttribute('aria-label', PUNTOS[pt.dataset.punto].k);
    });

    // Etiqueta corta junto al punto activo (solo el nombre; el detalle va en el panel)
    var label = document.createElementNS(SVGNS, 'g');
    label.setAttribute('class', 'pt-label');
    label.setAttribute('aria-hidden', 'true');
    var labelBg = document.createElementNS(SVGNS, 'rect');
    var labelTxt = document.createElementNS(SVGNS, 'text');
    label.appendChild(labelBg); label.appendChild(labelTxt);
    svg.appendChild(label);

    /* ── Cámara: cada punto tiene un encuadre (viewBox, proporción 1200×580) y los
       grupos del dibujo que se quedan encendidos; el resto se atenúa ── */
    var FULL = [0, 120, 1200, 580];
    var FOCUS = {
      hermeticidad:    { vb: [225, 362, 700, 338], g: ['zia-tanques'] },
      volumetrico:     { vb: [266, 251, 500, 242], g: ['zia-dispensarios'] },
      // Marco propio (x1, y1, x2, y2): líneas de datos + consola, no toda la tienda
      telemedicion:    { vb: [425, 278, 640, 309], g: ['zia-telemedicion', 'zia-tienda'], box: [478, 334, 1008, 534] },
      videovigilancia: { vb: [860, 180, 340, 164], g: ['zia-camara'] },
      electrica:       { vb: [580, 145, 620, 300], g: ['zia-electrica'] },
      seguridad:       { vb: [220, 120, 600, 290], g: ['zia-marquesina'] }
    };
    var cam = { x: FULL[0], y: FULL[1], w: FULL[2], h: FULL[3] };
    var zoomed = false, emph = null, frameTween = null;
    var pts = svg.querySelectorAll('.pt'), rings = svg.querySelectorAll('.pt-ring');
    var reset = station.querySelector('.zia-station__reset');

    // Marco punteado que señala el componente enfocado
    var frame = document.createElementNS(SVGNS, 'rect');
    frame.setAttribute('class', 'focus-frame');
    frame.setAttribute('aria-hidden', 'true');
    svg.insertBefore(frame, svg.querySelector('#zia-puntos'));

    // Puntos, etiqueta y marco conservan su tamaño en pantalla aunque cambie el zoom
    function applyCam() {
      svg.setAttribute('viewBox', [cam.x, cam.y, cam.w, cam.h].join(' '));
      var k = cam.w / FULL[2];
      pts.forEach(function (p) { p.setAttribute('r', 11 * k); });
      rings.forEach(function (r) { r.setAttribute('r', 11 * k); });
      return k;
    }

    function placeLabel(pt, text) {
      var k = cam.w / FULL[2];
      labelTxt.textContent = text;
      labelTxt.setAttribute('font-size', 20 * k);
      var cx = +pt.getAttribute('cx'), cy = +pt.getAttribute('cy');
      var w = labelTxt.getBBox().width + 30 * k, h = 38 * k, gap = 26 * k;
      var minX = cam.x + 8 * k, maxX = cam.x + cam.w - 8 * k, minY = cam.y + 6 * k;
      // Arriba del punto (suele haber cielo o espacio libre); debajo si no cabe en el encuadre
      var x = Math.max(minX, Math.min(maxX - w, cx - w / 2));
      var y = cy - gap - h < minY ? cy + gap : cy - gap - h;
      labelBg.setAttribute('x', x); labelBg.setAttribute('y', y);
      labelBg.setAttribute('width', w); labelBg.setAttribute('height', h); labelBg.setAttribute('rx', h / 2);
      labelTxt.setAttribute('x', x + 15 * k); labelTxt.setAttribute('y', y + h / 2 + 7 * k);
    }

    function placeFrame(f) {
      var k = cam.w / FULL[2], pad = 14 * k, box = null;
      if (f.box) box = { x1: f.box[0], y1: f.box[1], x2: f.box[2], y2: f.box[3] };
      else f.g.forEach(function (gid) {
        var g = document.getElementById(gid);
        if (!g) return;
        var b = g.getBBox();
        box = box ? { x1: Math.min(box.x1, b.x), y1: Math.min(box.y1, b.y), x2: Math.max(box.x2, b.x + b.width), y2: Math.max(box.y2, b.y + b.height) }
                  : { x1: b.x, y1: b.y, x2: b.x + b.width, y2: b.y + b.height };
      });
      if (!box) return;
      // El marco nunca se sale del encuadre
      var inset = 5 * k;
      var x1 = Math.max(cam.x + inset, box.x1 - pad), y1 = Math.max(cam.y + inset, box.y1 - pad);
      var x2 = Math.min(cam.x + cam.w - inset, box.x2 + pad), y2 = Math.min(cam.y + cam.h - inset, box.y2 + pad);
      frame.setAttribute('x', x1); frame.setAttribute('y', y1);
      frame.setAttribute('width', x2 - x1); frame.setAttribute('height', y2 - y1);
      frame.setAttribute('rx', 14 * k);
      frame.setAttribute('stroke-dasharray', (10 * k) + ' ' + (7 * k));
    }

    function dim(groupIds) {
      svg.querySelectorAll(':scope > g').forEach(function (g) {
        if (g.id === 'zia-puntos' || g.classList.contains('pt-label')) return;
        g.classList.toggle('is-dim', !!groupIds && groupIds.indexOf(g.id) === -1);
      });
    }

    /* Animación de énfasis propia de cada componente (en bucle mientras está enfocado) */
    function emphasis(id) {
      if (emph) { emph.revert ? emph.revert() : emph.progress(0).kill(); emph = null; }
      svg.querySelectorAll('#zia-telemedicion .dash').forEach(function (p) { p.style.animationDuration = ''; });
      if (!hasGsap || reduced || !id) return;
      var q = function (s) { return svg.querySelectorAll(s); };
      emph = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } });
      if (id === 'hermeticidad') {
        // El nivel del combustible sube y baja, como en una medición
        emph.to('#zia-nivel-1', { attr: { y: 566, height: 74 }, duration: 1.3 }, 0)
            .to('#zia-nivel-2', { attr: { y: 582, height: 58 }, duration: 1.3 }, .3);
      } else if (id === 'volumetrico') {
        // Las pantallas de los dispensarios parpadean al contar litros
        emph.to(q('#zia-dispensarios .lt.tm'), { opacity: .3, duration: .45, stagger: .2 });
      } else if (id === 'telemedicion') {
        // El flujo de datos hacia la consola se acelera y la consola pulsa
        q('#zia-telemedicion .dash').forEach(function (p) { p.style.animationDuration = '.45s'; });
        emph.to(q('#zia-telemedicion circle'), { attr: { r: 10 }, duration: .6 }, 0)
            .to(q('#zia-tienda path[stroke="#4fd1c5"]'), { opacity: .2, duration: .35 }, 0);
      } else if (id === 'videovigilancia') {
        // El cono de visión de la cámara hace un barrido
        emph.fromTo(q('#zia-camara path[stroke-dasharray]'), { rotation: -14, svgOrigin: '1100 250' }, { rotation: 10, svgOrigin: '1100 250', duration: 1.4 });
      } else if (id === 'electrica') {
        // El cable "chispea" en dorado
        emph.to(q('#zia-electrica path'), { stroke: '#A69140', strokeWidth: 4, duration: .22, stagger: .06 });
      } else if (id === 'seguridad') {
        // La franja de la marquesina pulsa como señal de operación segura
        emph.to(q('#zia-marquesina rect.tm'), { opacity: .35, duration: .6 }, 0)
            .to(q('#zia-marquesina path[stroke="#A69140"]'), { strokeWidth: 5, duration: .6 }, 0);
      }
    }

    function zoomTo(id) {
      var f = id ? FOCUS[id] : null;
      var vb = f ? f.vb : FULL;
      zoomed = !!f;
      station.classList.toggle('is-zoomed', zoomed);
      if (reset) reset.hidden = !zoomed;
      dim(f ? f.g : null);
      emphasis(id);
      var done = function () {
        applyCam();
        var pt = current && svg.querySelector('.pt[data-punto="' + current + '"]');
        if (pt) placeLabel(pt, PUNTOS[current].l || PUNTOS[current].k);
        if (f) placeFrame(f);
        if (hasGsap && !reduced) {
          gsap.fromTo([label, frame], { opacity: 0 }, { opacity: 1, duration: .3, clearProps: 'opacity' });
          // Guiones "en marcha" alrededor del componente (un ciclo = un guion + un espacio)
          if (f) frameTween = gsap.fromTo(frame, { strokeDashoffset: 0 }, { strokeDashoffset: -17 * (cam.w / FULL[2]), duration: .7, ease: 'none', repeat: -1 });
        }
      };
      if (frameTween) { frameTween.kill(); frameTween = null; }
      frame.classList.toggle('is-on', !!f);
      if (!hasGsap || reduced) {
        // Sin animación: la vista general se mantiene y solo se resalta el componente
        if (!reduced) { cam.x = vb[0]; cam.y = vb[1]; cam.w = vb[2]; cam.h = vb[3]; }
        return done();
      }
      gsap.set([label, frame], { opacity: 0 });
      gsap.to(cam, { x: vb[0], y: vb[1], w: vb[2], h: vb[3], duration: .9, ease: 'power3.inOut', overwrite: true, onUpdate: applyCam, onComplete: done });
    }

    function show(id, opts) {
      var data = PUNTOS[id];
      var pt = svg.querySelector('.pt[data-punto="' + id + '"]');
      if (!data || !pt) return;
      current = id;
      pts.forEach(function (p) { p.classList.toggle('is-active', p === pt); });
      legend.forEach(function (b) { b.classList.toggle('is-active', b.dataset.punto === id); });
      tip.querySelector('.zia-station__tip-kicker').textContent = data.k;
      tip.querySelector('.zia-station__tip-title').textContent = data.t;
      tip.querySelector('.zia-station__tip-desc').textContent = data.d;
      tip.querySelector('.zia-station__tip-link').dataset.tema = data.tema;
      // Se anima el contenedor (div y g), no sus hijos: main.css da transition a span/a y chocaría con GSAP
      if (hasGsap && !reduced) gsap.fromTo(tip, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .3, ease: 'power2.out', clearProps: 'opacity,transform' });
      if (opts && opts.zoom === false) { placeLabel(pt, data.l || data.k); return; }
      zoomTo(id);
    }
    function stopAuto() { userTook = true; clearInterval(timer); clearTimeout(startTimer); }

    // Clic o teclado (no hover): con el zoom, el punto se movería bajo el cursor
    pts.forEach(function (pt) {
      pt.addEventListener('click', function () { stopAuto(); show(pt.dataset.punto); });
      pt.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stopAuto(); show(pt.dataset.punto); }
      });
    });
    legend.forEach(function (b) {
      b.addEventListener('click', function () { stopAuto(); show(b.dataset.punto); });
    });
    if (reset) reset.addEventListener('click', function () { stopAuto(); zoomTo(null); });

    // El panel nunca queda vacío: arranca con el primer punto y la vista completa
    applyCam();
    show(ids[0], { zoom: false });

    // Recorrido automático tipo cámara mientras el diagrama está a la vista y nadie interactúa
    var startTimer = null;
    if (!reduced) {
      var i = 0;
      var cycle = function () { show(ids[i % ids.length]); i++; };
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          clearInterval(timer); clearTimeout(startTimer);
          // Fuera de la vista, los bucles de énfasis y del marco no gastan cuadros
          if (emph) emph.paused(!en.isIntersecting);
          if (frameTween) frameTween.paused(!en.isIntersecting);
          // Primero se ve la estación completa un momento; luego empieza el recorrido
          if (en.isIntersecting && !userTook) startTimer = setTimeout(function () { cycle(); timer = setInterval(cycle, 4200); }, 1400);
        });
      }, { threshold: .4 }).observe(station);
    }

    // Copia limpia del diagrama para la ficha de regulador y la escena de "Cómo trabajamos":
    // vista completa, sin zoom, marco, etiqueta ni animaciones a medias; ids con prefijo.
    window.ziaCloneStation = function (prefix) {
      var c = svg.cloneNode(true);
      c.removeAttribute('role');
      c.setAttribute('aria-hidden', 'true');
      c.setAttribute('viewBox', FULL.join(' '));
      c.querySelectorAll('.focus-frame, .pt-label').forEach(function (el) { el.remove(); });
      c.querySelectorAll('.is-dim, .is-active').forEach(function (el) { el.classList.remove('is-dim', 'is-active'); });
      c.querySelectorAll('[style]').forEach(function (el) { el.removeAttribute('style'); });
      c.querySelectorAll('#zia-camara path[stroke-dasharray]').forEach(function (el) { el.removeAttribute('transform'); });
      var n1 = c.querySelector('#zia-nivel-1'), n2 = c.querySelector('#zia-nivel-2');
      if (n1) { n1.setAttribute('y', 580); n1.setAttribute('height', 60); }
      if (n2) { n2.setAttribute('y', 595); n2.setAttribute('height', 45); }
      c.querySelectorAll('.pt, .pt-ring').forEach(function (el) { el.setAttribute('r', 11); });
      c.querySelectorAll('.pt').forEach(function (pt) {
        pt.removeAttribute('tabindex'); pt.removeAttribute('role'); pt.removeAttribute('aria-label');
      });
      c.querySelectorAll('[id]').forEach(function (el) { el.id = prefix + el.id; });
      c.querySelectorAll('[clip-path]').forEach(function (el) {
        el.setAttribute('clip-path', el.getAttribute('clip-path').replace('url(#', 'url(#' + prefix));
      });
      return c;
    };
  }
}());

/* ── Ficha de cada regulador (modal desde la franja del hero) ──
   Contenido tomado de docs/client-brief.md. "spots" son los puntos de la
   estación interactiva donde aplica cada autoridad. */
(function () {
  var modal = document.getElementById('zia-reg-modal');
  if (!modal || typeof modal.showModal !== 'function') return;
  var hasGsap = typeof gsap !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var SPOTS = {
    hermeticidad: 'Tanques', volumetrico: 'Dispensarios', telemedicion: 'Consola de telemedición',
    videovigilancia: 'Cámaras', electrica: 'Instalación eléctrica', seguridad: 'Operación y emergencias'
  };
  var ORDER = ['asea', 'cre', 'sat', 'stps', 'pc'];
  var REGS = {
    asea: {
      abbr: 'ASEA', name: 'Agencia de Seguridad, Energía y Ambiente', icon: 'asea',
      role: 'Vigila la seguridad industrial, la operación y la protección ambiental de su estación.',
      spots: ['hermeticidad', 'seguridad'],
      services: [
        'Elaboración, dictaminación e implementación de SASISOPA',
        'Licencia de Funcionamiento y Cédula de Operación Anual',
        'Registro en el Portal del Regulado (CURR)',
        'Manifiesto de Impacto Ambiental o Informe Preventivo',
        'Análisis de riesgo y Protocolo de Respuesta a Emergencias',
        'Registro de pólizas de seguro y de generador de residuos peligrosos',
        'Verificación conforme a NOM-005-ASEA-2016'
      ],
      risk: 'Sin SASISOPA o Cédula de Operación Anual vigente, la estación puede ser clausurada.',
      tema: 'ASEA'
    },
    cre: {
      abbr: 'CNE', name: 'Comisión Nacional de Energía', icon: 'cre',
      role: 'Otorga el permiso para vender combustible y recibe sus reportes de volumen.',
      spots: ['volumetrico', 'telemedicion'],
      services: [
        'Altas y solicitudes de permiso',
        'Modificaciones al permiso y cambio de Representante Legal',
        'Reportes diarios, trimestrales y anuales',
        'Reporte de Estructura Accionaria',
        'Sistemas de Gestión de la Medición y NOM-016-CRE-2016',
        'Regularización de trámites y obligaciones pendientes'
      ],
      risk: 'Sin reportes al día, el permiso para vender combustible queda en riesgo.',
      tema: 'CNE'
    },
    sat: {
      abbr: 'SAT', name: 'Servicio de Administración Tributaria', icon: 'sat',
      role: 'Revisa el control volumétrico y las obligaciones fiscales de cada litro que vende.',
      spots: ['volumetrico', 'telemedicion', 'hermeticidad'],
      services: [
        'Control volumétrico conforme a la Miscelánea Fiscal',
        'Envío de archivos y certificados JSON o XML',
        'Aviso de funcionamiento del control volumétrico',
        'Seguridad perimetral de la red de datos (Anexo 30)',
        'Verificación certificada del Anexo 30',
        'Pruebas de hermeticidad y cubicación de tanques (Anexo 32)'
      ],
      risk: 'Fallas en el control volumétrico pueden derivar en multas, auditorías fiscales y embargo.',
      tema: 'SAT'
    },
    stps: {
      abbr: 'STPS', name: 'Secretaría del Trabajo y Previsión Social', icon: 'stps',
      role: 'Cuida la seguridad e higiene de quienes trabajan en su estación.',
      spots: ['electrica'],
      services: [
        'Consultoría en seguridad e higiene laboral',
        'Estudios de iluminación y ruido',
        'Estudios de energía estática',
        'Verificación de instalaciones eléctricas (NOM-001-SEDE-2012)'
      ],
      risk: 'Incumplir las normas de seguridad e higiene genera multas por cada trabajador expuesto.',
      tema: 'STPS'
    },
    pc: {
      abbr: 'Protección Civil', name: 'Protección Civil', icon: 'proteccion-civil',
      role: 'Evalúa la capacidad de su estación para responder ante emergencias y riesgos.',
      spots: ['seguridad'],
      services: [
        'Consultoría en Protección Civil',
        'Análisis de riesgo de la estación',
        'Protocolo de Respuesta a Emergencias'
      ],
      risk: null, tema: 'Protección Civil'
    }
  };

  var card = modal.querySelector('.zia-reg-modal__card');
  var $ = function (sel) { return modal.querySelector(sel); };
  var tabs = $('.zia-reg-modal__tabs');
  var current = null, opener = null, mini = null;

  // Pestañas, una por regulador
  ORDER.forEach(function (k) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'zia-reg-modal__tab'; b.setAttribute('role', 'tab');
    b.dataset.reg = k; b.style.setProperty('--tc', 'var(--zia-' + k + ')');
    b.textContent = k === 'pc' ? 'P. Civil' : REGS[k].abbr;
    b.addEventListener('click', function () { go(k); });
    tabs.appendChild(b);
  });

  // Mini estación: copia limpia de la ilustración de la sección 2
  function buildMini() {
    var wrap = $('.zia-reg-modal__station');
    if (!wrap || !window.ziaCloneStation) return null;
    var svg = window.ziaCloneStation('mini-');
    wrap.className = 'zia-reg-modal__station zia-station zia-station--mini';
    wrap.appendChild(svg);
    return svg;
  }

  // El nombre se parte en palabras para animarlas una por una
  function setWords(el, text) {
    el.textContent = '';
    text.split(' ').forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'zia-word'; s.textContent = w;
      el.appendChild(s);
      if (i < text.split(' ').length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  var CHECK = '<svg viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="11"/><path d="M6.5 11.5l3 3 6-6.5"/></svg>';

  function render(k) {
    var r = REGS[k];
    current = k;
    card.style.setProperty('--c', 'var(--zia-' + k + ')');
    $('.zia-reg-modal__badge img').src = 'assets/images/zia/icons/' + r.icon + '.svg';
    $('.zia-reg-modal__abbr').textContent = k === 'pc' ? 'P. Civil' : r.abbr;
    setWords($('.zia-reg-modal__name'), r.name);
    $('.zia-reg-modal__role').textContent = r.role;

    if (!mini) mini = buildMini();
    if (mini) {
      mini.querySelectorAll('.pt').forEach(function (pt) {
        var on = r.spots.indexOf(pt.dataset.punto) !== -1;
        pt.classList.toggle('is-on', on);
        // En la copia pequeña los puntos activos se agrandan para leerse; los demás se achican
        pt.setAttribute('r', on ? 20 : 9);
        var ring = pt.previousElementSibling;
        if (ring && ring.classList.contains('pt-ring')) { ring.classList.toggle('is-on', on); ring.setAttribute('r', 20); }
      });
    }
    $('.zia-reg-modal__spots').innerHTML = r.spots.map(function (s) { return '<li>' + SPOTS[s] + '</li>'; }).join('');
    $('.zia-reg-modal__list').innerHTML = r.services.map(function (s) { return '<li>' + CHECK + '<span>' + s + '</span></li>'; }).join('');

    var risk = $('.zia-reg-modal__risk');
    risk.hidden = !r.risk;
    $('.zia-reg-modal__risk-txt').textContent = r.risk || '';

    var cta = $('.zia-reg-modal__cta');
    cta.dataset.tema = r.tema;
    cta.querySelector('.btn-text span').textContent = 'Diagnóstico ' + (k === 'pc' ? 'de Protección Civil' : r.abbr) + ' sin costo';

    tabs.querySelectorAll('.zia-reg-modal__tab').forEach(function (b) {
      var sel = b.dataset.reg === k;
      b.setAttribute('aria-selected', sel ? 'true' : 'false');
      b.tabIndex = sel ? 0 : -1;
      // Pestaña activa visible en móvil; solo se desplaza la barra (scrollIntoView movería también la página)
      if (sel && tabs.scrollWidth > tabs.clientWidth) {
        var l = b.offsetLeft - tabs.offsetLeft, rgt = l + b.offsetWidth;
        if (l < tabs.scrollLeft) tabs.scrollLeft = l - 12;
        else if (rgt > tabs.scrollLeft + tabs.clientWidth) tabs.scrollLeft = rgt - tabs.clientWidth + 12;
      }
    });
  }

  // Coreografía de entrada: insignia, nombre por palabras, puntos de la estación y checklist
  var tl = null;
  function animateIn(dir) {
    if (!hasGsap || reduced) return;
    // Si se cambia de pestaña a media animación, la anterior termina en su estado final
    if (tl) tl.progress(1).kill();
    tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (dir) tl.from('.zia-reg-modal__body, .zia-reg-modal__titles', { x: dir * 36, opacity: 0, duration: .4 }, 0);
    tl.from('.zia-reg-modal__badge', { scale: .4, rotation: -25, opacity: 0, duration: .6, ease: 'back.out(1.8)' }, 0)
      .from('.zia-reg-modal__name .zia-word', { y: 18, opacity: 0, duration: .45, stagger: .06 }, .1)
      .from('.zia-reg-modal__role', { y: 10, opacity: 0, duration: .4 }, .3)
      .from('.zia-station--mini .pt.is-on', { scale: 0, transformOrigin: '50% 50%', duration: .5, stagger: .15, ease: 'back.out(3)' }, .35)
      .from('.zia-reg-modal__spots li', { y: 8, opacity: 0, duration: .3, stagger: .08 }, .5)
      .from('.zia-reg-modal__list li', { x: 14, opacity: 0, duration: .35, stagger: .06 }, .3)
      .fromTo('.zia-reg-modal__list path', { strokeDasharray: 20, strokeDashoffset: 20 }, { strokeDashoffset: 0, duration: .35, stagger: .06, ease: 'power1.out' }, .45)
      .from('.zia-reg-modal__risk:not([hidden])', { y: 10, opacity: 0, duration: .4 }, .6);
  }

  function go(k, dir) {
    if (k === current) return;
    if (dir === undefined) dir = ORDER.indexOf(k) > ORDER.indexOf(current) ? 1 : -1;
    render(k);
    animateIn(dir);
  }
  function step(d) { go(ORDER[(ORDER.indexOf(current) + d + ORDER.length) % ORDER.length], d); }

  // Mientras la ficha está abierta la página de fondo no se desplaza
  function lockScroll(lock) {
    var sm = window.ScrollSmoother && ScrollSmoother.get && ScrollSmoother.get();
    if (sm) sm.paused(lock);
    document.documentElement.style.overflow = lock ? 'hidden' : '';
  }

  function open(k, btn) {
    opener = btn || null;
    current = null;
    // Un cierre animado aún pendiente no debe cerrar la ficha recién abierta
    if (hasGsap) { gsap.killTweensOf(card); gsap.set(card, { clearProps: 'transform,opacity' }); }
    render(k);
    modal.showModal();
    lockScroll(true);
    if (hasGsap && !reduced) {
      var mobile = window.matchMedia('(max-width: 767px)').matches;
      gsap.fromTo(card, mobile ? { yPercent: 100 } : { y: 40, scale: .97, opacity: 0 },
        { yPercent: 0, y: 0, scale: 1, opacity: 1, duration: mobile ? .5 : .45, ease: 'power3.out', clearProps: 'transform,opacity' });
    }
    animateIn(0);
  }
  function closeNow() {
    if (!modal.open) return;
    if (hasGsap) gsap.killTweensOf(card);
    modal.close();
  }
  function close() {
    if (!modal.open) return;
    if (!hasGsap || reduced) return closeNow();
    var mobile = window.matchMedia('(max-width: 767px)').matches;
    var to = mobile ? { yPercent: 100, duration: .3 } : { y: 24, opacity: 0, duration: .22 };
    to.ease = 'power2.in';
    to.onComplete = function () { closeNow(); gsap.set(card, { clearProps: 'transform,opacity' }); };
    gsap.to(card, to);
  }
  modal.addEventListener('close', function () {
    lockScroll(false);
    if (opener) opener.focus({ preventScroll: true });
  });

  document.querySelectorAll('.zia-lp-regs__item[data-reg]').forEach(function (btn) {
    btn.addEventListener('click', function () { open(btn.dataset.reg, btn); });
  });
  $('.zia-reg-modal__close').addEventListener('click', close);
  // Clic en el fondo (fuera de la tarjeta) cierra
  modal.addEventListener('click', function (e) {
    if (e.target === modal) return close();
    // Los enlaces internos (formulario) cierran la ficha antes de desplazar la página
    if (e.target.closest('a[href^="#"]')) closeNow();
  });
  modal.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  modal.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  // Deslizar a los lados cambia de regulador
  var tx = 0, ty = 0;
  card.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  card.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }, { passive: true });
}());

/* ── Cómo trabajamos: la estación se pone en regla ──
   Se reproduce sola como un video al llegar a la sección (controles: play/pausa,
   barra de progreso y pasos clicables):
   1 auditoría (escáner, hallazgos en rojo) → 2 plan (prioridades en ámbar) →
   3 ejecución (verdes con palomita, medidor a 100%) → 4 seguimiento (ondas + resultado). */
(function () {
  var scene = document.getElementById('proceso');
  if (!scene || !scene.classList.contains('zia-scene') || !window.ziaCloneStation) return;
  var NS = 'http://www.w3.org/2000/svg';
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stage = scene.querySelector('.zia-scene__stage');
  var steps = scene.querySelectorAll('.zia-scene__steps li');
  var meterVal = scene.querySelector('.zia-scene__meter-val');
  var bar = scene.querySelector('.zia-scene__bar i');
  var status = scene.querySelector('.zia-scene__status');
  var result = scene.querySelector('.zia-scene__result');

  var svg = window.ziaCloneStation('esc-');
  stage.insertBefore(svg, stage.firstChild);

  var C = { gray: '#c9d6d6', red: '#EC3237', amber: '#d99a1e', green: '#2f9e6b', teal: '#1e8a8a' };
  // Orden del plan: primero lo que puede clausurar u originar multas mayores
  var ORDER = ['seguridad', 'volumetrico', 'telemedicion', 'hermeticidad', 'electrica', 'videovigilancia'];
  var pts = {};
  svg.querySelectorAll('.pt').forEach(function (p) { pts[p.dataset.punto] = p; });

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  var layer = el('g', { 'class': 'scene-layer' }, svg);

  // Escáner: franja con degradado que recorre la estación de izquierda a derecha
  var defs = el('defs', {}, svg);
  var grad = el('linearGradient', { id: 'esc-scan', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
  el('stop', { offset: 0, 'stop-color': C.teal, 'stop-opacity': 0 }, grad);
  el('stop', { offset: 1, 'stop-color': C.teal, 'stop-opacity': .32 }, grad);
  var scan = el('g', { 'class': 'scene-scan' }, layer);
  el('rect', { x: -110, y: 120, width: 110, height: 580, fill: 'url(#esc-scan)' }, scan);
  el('path', { d: 'M0 120V700', stroke: C.teal, 'stroke-width': 3 }, scan);

  // Insignia de prioridad (número) y palomita junto a cada punto
  var badges = {}, checks = {};
  ORDER.forEach(function (id, i) {
    var p = pts[id];
    var x = +p.getAttribute('cx') + 20, y = +p.getAttribute('cy') - 20;
    var b = el('g', { 'class': 'scene-badge', transform: 'translate(' + x + ' ' + y + ')' }, layer);
    el('circle', { r: 15, fill: C.amber, stroke: '#fff', 'stroke-width': 3 }, b);
    var t = el('text', { 'text-anchor': 'middle', y: 6, fill: '#fff' }, b);
    t.textContent = i + 1;
    var k = el('g', { 'class': 'scene-check', transform: 'translate(' + x + ' ' + y + ')' }, layer);
    el('circle', { r: 15, fill: C.green, stroke: '#fff', 'stroke-width': 3 }, k);
    el('path', { d: 'M-6.5 0.5l4.5 4.5 8.5-9.5', fill: 'none', stroke: '#fff', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, k);
    badges[id] = b; checks[id] = k;
  });

  // Ondas de monitoreo continuo desde el centro de la estación
  var radars = [0, 1, 2].map(function () {
    return el('circle', { 'class': 'scene-radar', cx: 600, cy: 420, r: 20, fill: 'none', stroke: C.teal, 'stroke-width': 3 }, layer);
  });

  function setMeter(v) {
    meterVal.textContent = Math.round(v) + '%';
    bar.style.transform = 'scaleX(' + (v / 100) + ')';
  }

  // Sin GSAP o con movimiento reducido: estado final, sin escena fija
  if (!hasGsap || reduced) {
    scene.classList.add('is-static');
    var ctl = scene.querySelector('.zia-scene__controls');
    if (ctl) ctl.hidden = true;
    ORDER.forEach(function (id) { pts[id].style.fill = C.green; badges[id].style.display = 'none'; });
    radars.forEach(function (r) { r.style.display = 'none'; });
    scan.style.display = 'none';
    steps.forEach(function (li) { li.classList.add('is-done'); });
    setMeter(100);
    return;
  }

  /* Línea de tiempo en unidades arbitrarias (0–10); el scroll la recorre completa */
  var T = { scan: .3, scanDur: 2.6, plan: 3.3, exec: 5.4, execStep: .42, watch: 8.2, result: 9.1 };
  var revealAt = {}, doneAt = {};
  var tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
  gsap.set(svg.querySelectorAll('.pt'), { fill: C.gray });
  gsap.set([].concat(ORDER.map(function (id) { return badges[id]; }), ORDER.map(function (id) { return checks[id]; })), { scale: 0, transformOrigin: '50% 50%' });
  gsap.set(radars, { opacity: 0 });
  gsap.set(scan, { opacity: 0, x: 0 });
  gsap.set(result, { autoAlpha: 0, y: 30 });
  gsap.set(bar, { scaleX: 0, transformOrigin: '0% 50%' });

  // 1. Auditoría: el escáner pasa y cada punto se enciende en rojo al cruzarlo
  tl.to(scan, { opacity: 1, duration: .15 }, T.scan)
    .to(scan, { x: 1310, duration: T.scanDur, ease: 'none' }, T.scan)
    .to(scan, { opacity: 0, duration: .2 }, T.scan + T.scanDur - .2);
  Object.keys(pts).forEach(function (id) {
    var p = pts[id], t = T.scan + T.scanDur * (+p.getAttribute('cx') + 10) / 1310;
    revealAt[id] = t;
    tl.to(p, { fill: C.red, duration: .12 }, t)
      .fromTo(p, { attr: { r: 11 } }, { attr: { r: 18 }, duration: .14, yoyo: true, repeat: 1, ease: 'power1.inOut' }, t);
  });
  // 2. Estrategia: cada hallazgo recibe su número de prioridad
  ORDER.forEach(function (id, i) {
    var t = T.plan + i * .22;
    tl.to(badges[id], { scale: 1, duration: .3, ease: 'back.out(2.2)' }, t)
      .to(pts[id], { fill: C.amber, duration: .2 }, t);
  });
  // 3. Ejecución: en orden de prioridad, cada punto pasa a verde con palomita
  ORDER.forEach(function (id, i) {
    var t = T.exec + i * T.execStep;
    doneAt[id] = t + .1;
    tl.to(badges[id], { scale: 0, duration: .18, ease: 'power1.in' }, t)
      .to(checks[id], { scale: 1, duration: .32, ease: 'back.out(2.2)' }, t + .1)
      .to(pts[id], { fill: C.green, duration: .2 }, t);
  });
  tl.to(bar, { scaleX: 1, duration: ORDER.length * T.execStep + .3, ease: 'none' }, T.exec);
  // 4. Seguimiento: ondas de monitoreo y, al final, el resultado
  radars.forEach(function (r, i) {
    tl.fromTo(r, { attr: { r: 20 }, opacity: .75 }, { attr: { r: 640 }, opacity: 0, duration: 1.3, ease: 'power1.out' }, T.watch + i * .35);
  });
  tl.to(result, { autoAlpha: 1, y: 0, duration: .6 }, T.result)
    .to({}, { duration: .5 }, T.result + .6); // pausa final antes de soltar la escena

  // Pasos, estado y medidor según el punto de la línea de tiempo
  var lastKey = '';
  function sync() {
    var t = tl.time();
    var step = t < T.plan - .2 ? 0 : t < T.exec - .2 ? 1 : t < T.watch - .1 ? 2 : 3;
    var txt;
    if (t < T.scan) txt = 'Su estación hoy';
    else if (step === 0) txt = 'Auditoría: ' + Object.keys(revealAt).filter(function (id) { return t >= revealAt[id]; }).length + ' hallazgos';
    else if (step === 1) txt = 'Plan priorizado: ' + ORDER.length + ' acciones';
    else if (step === 2) txt = 'Resueltos: ' + ORDER.filter(function (id) { return t >= doneAt[id]; }).length + ' de ' + ORDER.length;
    else txt = t < T.result ? 'Monitoreo continuo activo' : 'Estación en regla';
    var key = step + '|' + txt;
    if (key !== lastKey) {
      lastKey = key;
      steps.forEach(function (li, i) { li.classList.toggle('is-active', i === step); li.classList.toggle('is-done', i < step); });
      status.textContent = txt;
      status.classList.toggle('is-ok', step >= 2);
      scene.classList.toggle('is-result', t >= T.result); // en móvil el resultado sale de la estación
    }
    setMeter(gsap.getProperty(bar, 'scaleX') * 100);
  }
  /* ── Reproducción tipo video: arranca sola al llegar a la sección ── */
  var controls = scene.querySelector('.zia-scene__controls');
  var playBtn = scene.querySelector('.zia-scene__play');
  var track = scene.querySelector('.zia-scene__track');
  var trackFill = scene.querySelector('.zia-scene__track-fill');
  var timeLbl = scene.querySelector('.zia-scene__time');
  var STARTS = [0, T.plan - .2, T.exec - .2, T.watch - .1];
  var userPaused = false;
  tl.timeScale(.85); // ~12 s en total

  // Marcas de cada paso sobre la barra de progreso
  STARTS.forEach(function (s, i) {
    var tick = document.createElement('span');
    tick.className = 'zia-scene__tick';
    tick.style.left = (s / tl.duration() * 100) + '%';
    if (i === 0) tick.style.display = 'none';
    track.appendChild(tick);
  });

  function setState() {
    var st = tl.progress() >= 1 ? 'ended' : tl.paused() ? 'paused' : 'playing';
    controls.dataset.state = st;
    playBtn.setAttribute('aria-label', st === 'playing' ? 'Pausar' : st === 'ended' ? 'Repetir' : 'Reproducir');
  }
  function play() { if (tl.progress() >= 1) tl.restart(); else tl.play(); setState(); }
  function pause() { tl.pause(); setState(); }

  var baseSync = sync;
  sync = function () {
    baseSync();
    trackFill.style.transform = 'scaleX(' + tl.progress() + ')';
    var t = tl.time(), n = t < STARTS[1] ? 1 : t < STARTS[2] ? 2 : t < STARTS[3] ? 3 : 4;
    timeLbl.textContent = 'Paso ' + n + ' de 4';
  };
  tl.eventCallback('onUpdate', sync);
  tl.eventCallback('onComplete', setState);
  sync();
  setState();

  playBtn.addEventListener('click', function () {
    if (controls.dataset.state === 'playing') { userPaused = true; pause(); }
    else { userPaused = false; play(); }
  });
  // Clic en la barra: salta a ese punto y sigue reproduciendo
  track.addEventListener('click', function (e) {
    var r = track.getBoundingClientRect();
    tl.progress(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
    userPaused = false; play();
  });
  // Clic en un paso: salta a su inicio
  steps.forEach(function (li, i) {
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    var go = function () { tl.time(STARTS[i]); userPaused = false; tl.play(); setState(); };
    li.addEventListener('click', go);
    li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  // Arranca la primera vez que se ve y desde ahí sigue sola: el scroll ya no la pausa ni la controla
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      io.disconnect();
      if (!userPaused && tl.progress() === 0) play();
    });
  }, { threshold: .45 });
  io.observe(stage);
}());

/* ── Quiénes somos: los reguladores se suman alrededor de ZIA ──
   Trayectoria de docs/client-brief.md. Cada hito enciende los reguladores que ZIA
   sumó ese año; se reproduce sola al verse y los años se pueden tocar. */
(function () {
  var root = document.querySelector('#nosotros .zia-story');
  if (!root) return;
  var NS = 'http://www.w3.org/2000/svg';
  var hasGsap = typeof gsap !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HITOS = [
    { y: 2000, e: 'Orígenes en TI', d: 'Soporte y asesoría en sistemas de información y redes.', add: [] },
    { y: 2004, e: 'Especialización en hidrocarburos', d: 'Controles volumétricos para gasolineras.', add: ['sat'] },
    { y: 2010, e: 'Diversificación en seguridad', d: 'Consultoría en seguridad e higiene, Protección Civil y STPS.', add: ['stps', 'pc'] },
    { y: 2015, e: 'Adaptación regulatoria', d: 'Ampliamos el catálogo para la CRE (hoy CNE) y ASEA.', add: ['cre', 'asea'] },
    { y: 'Hoy', e: 'Liderazgo integral', d: 'De la auditoría a la defensoría jurídica, ante los cinco reguladores.', add: [] }
  ];
  // Posición en la órbita (grados; 0 = derecha): se encienden en el sentido del reloj desde arriba
  var ANG = { sat: -90, stps: -18, pc: 54, cre: 126, asea: 198 };
  var R = 40; // radio en % del lado de la órbita

  var orbit = root.querySelector('.zia-orbit');
  var lines = root.querySelector('.zia-orbit__lines');
  var core = root.querySelector('.zia-orbit__core');
  var now = root.querySelector('.zia-story__now');
  var yearEl = root.querySelector('.zia-story__year');
  var eventEl = root.querySelector('.zia-story__event');
  var detailEl = root.querySelector('.zia-story__detail');
  var playBtn = root.querySelector('.zia-story__play');
  var yearBtns = root.querySelectorAll('.zia-story__years button');
  var nodes = {}, rays = {};

  root.querySelectorAll('.zia-orbit__node').forEach(function (n) {
    var a = ANG[n.dataset.reg] * Math.PI / 180;
    var x = 50 + R * Math.cos(a), y = 50 + R * Math.sin(a);
    n.style.left = x + '%'; n.style.top = y + '%';
    nodes[n.dataset.reg] = n;
    // Línea de luz del centro al regulador (line, no path: main.css da transition a svg path)
    var l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', 50); l.setAttribute('y1', 50); l.setAttribute('x2', x); l.setAttribute('y2', y);
    l.setAttribute('pathLength', 1);
    l.setAttribute('class', 'zia-orbit__ray');
    l.style.setProperty('--c', 'var(--zia-' + n.dataset.reg + ')');
    lines.appendChild(l);
    rays[n.dataset.reg] = l;
  });

  // Reguladores encendidos hasta el hito i (en "Hoy" están todos)
  function litUntil(i) {
    var on = [];
    HITOS.slice(0, i + 1).forEach(function (h) { on = on.concat(h.add); });
    return i >= HITOS.length - 1 ? Object.keys(ANG) : on;
  }
  var shown = -1;
  function setHito(i, animate) {
    var on = litUntil(i);
    Object.keys(nodes).forEach(function (k) {
      var lit = on.indexOf(k) !== -1;
      nodes[k].classList.toggle('is-on', lit);
      rays[k].classList.toggle('is-on', lit);
    });
    orbit.classList.toggle('is-full', i === HITOS.length - 1);
    yearBtns.forEach(function (b, j) {
      b.classList.toggle('is-done', j < i);
      if (j === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    if (i === shown) return;
    shown = i;
    eventEl.textContent = HITOS[i].e;
    detailEl.textContent = HITOS[i].d;
    // Se anima el contenedor (div): main.css da transition a b/p/span y chocaría con GSAP
    if (animate && hasGsap && !reduced) gsap.fromTo(now, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .45, ease: 'power2.out', clearProps: 'opacity,transform' });
  }

  // Sin GSAP o con movimiento reducido: estado final; los años cambian el hito sin animación
  if (!hasGsap || reduced) {
    setHito(HITOS.length - 1, false);
    yearEl.textContent = 'Hoy';
    playBtn.hidden = true;
    yearBtns.forEach(function (b) {
      b.addEventListener('click', function () { var i = +b.dataset.i; setHito(i, false); yearEl.textContent = HITOS[i].y; });
    });
    return;
  }

  /* Línea de tiempo: cada hito dura SEG; el año "cuenta" hacia el siguiente */
  var SEG = 2.6, year = { v: 2000 };
  var tl = gsap.timeline({ paused: true });
  tl.set(year, { v: 2000 }, 0);
  HITOS.forEach(function (h, i) {
    var t = i * SEG;
    if (typeof h.y === 'number' && i > 0) tl.to(year, { v: h.y, duration: .8, ease: 'power2.out', roundProps: 'v' }, t);
    h.add.forEach(function (k, j) {
      tl.fromTo(nodes[k].querySelector('.zia-orbit__dot'), { scale: .55 }, { scale: 1, duration: .6, ease: 'back.out(2.4)' }, t + .25 + j * .2)
        .fromTo(rays[k], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .7, ease: 'power2.out' }, t + .15 + j * .2);
    });
  });
  // "Hoy": el centro late (las líneas se intensifican por CSS con .is-full)
  var tHoy = (HITOS.length - 1) * SEG;
  tl.fromTo(core, { scale: 1 }, { scale: 1.12, duration: .35, yoyo: true, repeat: 1, ease: 'power1.inOut' }, tHoy + .2)
    .to({}, { duration: 1.6 }, tHoy + .6);

  function idxAt(t) { return Math.min(HITOS.length - 1, Math.floor(t / SEG + 1e-6)); }
  function sync() {
    var i = idxAt(tl.time());
    setHito(i, true);
    yearEl.textContent = i === HITOS.length - 1 ? 'Hoy' : Math.round(year.v);
  }
  function setState() {
    var st = tl.progress() >= 1 ? 'ended' : tl.paused() ? 'paused' : 'playing';
    playBtn.dataset.state = st;
    playBtn.setAttribute('aria-label', st === 'playing' ? 'Pausar' : st === 'ended' ? 'Repetir' : 'Reproducir');
  }
  tl.eventCallback('onUpdate', sync);
  tl.eventCallback('onComplete', setState);
  // Antes de reproducirse: 2000 sin reguladores encendidos
  tl.progress(0); sync(); setState();

  playBtn.addEventListener('click', function () {
    if (playBtn.dataset.state === 'playing') tl.pause();
    else if (tl.progress() >= 1) tl.restart();
    else tl.play();
    setState();
  });
  yearBtns.forEach(function (b) {
    b.addEventListener('click', function () { tl.time(+b.dataset.i * SEG); tl.play(); setState(); });
  });

  // Arranca la primera vez que se ve; el scroll no la controla
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      io.disconnect();
      if (tl.progress() === 0) { tl.play(); setState(); }
    });
  }, { threshold: .4 });
  io.observe(orbit);
}());

/* ── Cifras animadas: cuentan la primera vez que se ven ── */
(function () {
  if (typeof gsap === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var nums = document.querySelectorAll('.zia-figure b[data-count]');
  if (!nums.length) return;
  var counters = [];
  nums.forEach(function (el) {
    var end = +el.dataset.count;
    // El año arranca cerca de su valor para que no "cuente" desde cero
    var obj = { v: el.hasAttribute('data-plain') ? end - 40 : 0 };
    el.textContent = Math.round(obj.v);
    counters.push(function (i) {
      gsap.to(obj, { v: end, duration: 1.6, delay: i * .12, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(obj.v); } });
    });
  });
  var io = new IntersectionObserver(function (entries) {
    if (!entries.some(function (en) { return en.isIntersecting; })) return;
    io.disconnect();
    counters.forEach(function (start, i) { start(i); });
  }, { threshold: .5 });
  io.observe(nums[0].closest('.zia-figures') || nums[0]);
}());

/* ── Formulario de diagnóstico en 3 pasos (sin backend: envío simulado) ── */
(function () {
  var root = document.getElementById('zia-triage');
  if (!root) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var form    = document.getElementById('zia-triage-form');
  var panels  = root.querySelectorAll('.zia-triage__panel');
  var stepsUi = root.querySelectorAll('.zia-triage__steps li');
  var back    = root.querySelector('.zia-triage__nav .zia-triage__back');
  var nextTxt = root.querySelector('.zia-triage__next .btn-text span');
  var urgent  = root.querySelector('.zia-triage__urgent');
  var assign  = root.querySelector('.zia-assign');
  var done    = root.querySelector('.zia-triage__done');
  var step = 1;

  // Oficina que atiende cada estado. Propuesta de cobertura: validar con el cliente.
  var OFICINAS = {
    tijuana:   { key: 'tijuana',   name: 'Tijuana',   zone: 'Baja California', who: 'Mtra. Alma Estrella Domínguez', ini: 'AE' },
    chihuahua: { key: 'chihuahua', name: 'Chihuahua', zone: 'Norte',           who: 'Ing. Alejandro Vela',           ini: 'AV' },
    morelia:   { key: 'morelia',   name: 'Morelia',   zone: 'Centro',          who: 'Ing. Edilberto Brito',          ini: 'EB' },
    orizaba:   { key: 'orizaba',   name: 'Orizaba',   zone: 'Oriente',         who: 'Ing. Francisco Santos',         ini: 'FS' }
  };
  var REGION = {
    'Baja California': 'tijuana', 'Baja California Sur': 'tijuana', 'Sonora': 'tijuana',
    'Chihuahua': 'chihuahua', 'Coahuila': 'chihuahua', 'Durango': 'chihuahua', 'Nuevo León': 'chihuahua',
    'Tamaulipas': 'chihuahua', 'Sinaloa': 'chihuahua',
    'Veracruz': 'orizaba', 'Puebla': 'orizaba', 'Tlaxcala': 'orizaba', 'Oaxaca': 'orizaba', 'Tabasco': 'orizaba',
    'Chiapas': 'orizaba', 'Campeche': 'orizaba', 'Yucatán': 'orizaba', 'Quintana Roo': 'orizaba'
    // El resto del país: Morelia (Centro)
  };
  function officeFor(estado) { return estado ? OFICINAS[REGION[estado] || 'morelia'] : null; }
  // La sección de Cobertura usa la misma asignación (un solo lugar para validarla con el cliente)
  window.ziaCobertura = { officeFor: officeFor, oficinas: OFICINAS };

  function checked(name) {
    return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
  }
  function showError(name, on) {
    var e = root.querySelector('[data-error="' + name + '"]');
    if (e) e.hidden = !on;
  }

  /* Resumen en vivo ("Su diagnóstico"): refleja temas, urgencia y especialista conforme se eligen */
  var resumen = document.querySelector('#diagnostico .zia-resumen');
  var URG = { prevenir: 'Quiero prevenir', requerimiento: 'Tengo un requerimiento', clausura: 'Clausura o sanción en curso' };
  function setVal(el, txt, empty) { el.textContent = txt; el.classList.toggle('is-empty', !!empty); }
  function updateResumen() {
    if (!resumen) return;
    var temas = checked('temas');
    resumen.querySelectorAll('.zia-resumen__reg').forEach(function (r) {
      var on = temas.indexOf(r.dataset.tema) !== -1;
      // Aparece con un pequeño rebote (se anima la imagen: main.css da transition al span)
      var ico = r.querySelector('img, i');
      if (on && !r.classList.contains('is-on') && ico && window.gsap && !reduced) gsap.fromTo(ico, { scale: .5 }, { scale: 1, duration: .45, ease: 'back.out(2.6)', clearProps: 'transform' });
      r.classList.toggle('is-on', on);
      r.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var u = checked('urgencia')[0], urgEl = resumen.querySelector('[data-resumen="urgencia"]');
    setVal(urgEl, u ? URG[u] : 'Por definir', !u);
    urgEl.dataset.urg = u || '';
    var o = officeFor(form.elements.estado.value);
    var mono = resumen.querySelector('.zia-resumen__who .zia-monogram');
    mono.hidden = !o;
    if (o) mono.textContent = o.ini;
    setVal(resumen.querySelector('[data-resumen="atiende"]'), o ? o.who + ' · Oficina ' + o.name : 'Se asigna al elegir su estado', !o);
  }
  function setResumenState(txt, isDone) {
    if (!resumen) return;
    resumen.querySelector('.zia-resumen__state').textContent = txt;
    resumen.classList.toggle('is-done', !!isDone);
  }

  function show(n) {
    step = n;
    setResumenState('Paso ' + n + ' de 3', false);
    panels.forEach(function (p) {
      var on = +p.dataset.step === n;
      p.hidden = !on;
      p.classList.toggle('is-active', on);
    });
    stepsUi.forEach(function (li, i) {
      li.classList.toggle('is-current', i + 1 === n);
      li.classList.toggle('is-done', i + 1 < n);
    });
    back.hidden = n === 1;
    nextTxt.textContent = n === 3 ? 'Enviar solicitud' : 'Continuar';
    if (window.gsap && !reduced) gsap.fromTo(panels[n - 1], { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: .4, ease: 'power2.out', clearProps: 'transform,opacity' });
  }

  var RULES = {
    nombre:   function (v) { return v.trim().length >= 2; },
    empresa:  function (v) { return v.trim().length >= 2; },
    telefono: function (v) { return v.replace(/\D/g, '').length === 10; },
    email:    function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
    estado:   function (v) { return !!v; }
  };
  function validateData() {
    var first = null;
    Object.keys(RULES).forEach(function (n) {
      var el = form.elements[n];
      var ok = RULES[n](el.value);
      el.closest('.zia-field').classList.toggle('is-invalid', !ok);
      if (!ok && !first) first = el;
    });
    // Consentimiento del aviso de privacidad: casilla obligatoria antes de enviar
    var priv = form.elements.privacidad;
    var okPriv = priv.checked;
    priv.closest('.zia-field').classList.toggle('is-invalid', !okPriv);
    if (!okPriv && !first) first = priv;
    if (first && first.tagName !== 'SELECT') first.focus();
    return !first;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (step === 1) {
      var ok1 = checked('temas').length > 0;
      showError('temas', !ok1);
      if (ok1) show(2);
    } else if (step === 2) {
      var ok2 = checked('urgencia').length > 0;
      showError('urgencia', !ok2);
      if (ok2) show(3);
    } else if (validateData()) {
      finish();
    }
  });
  back.addEventListener('click', function () { show(step - 1); });

  form.querySelectorAll('input[name="temas"]').forEach(function (c) {
    c.addEventListener('change', function () { showError('temas', false); });
  });
  form.querySelectorAll('input[name="urgencia"]').forEach(function (r) {
    r.addEventListener('change', function () {
      showError('urgencia', false);
      urgent.hidden = checked('urgencia')[0] !== 'clausura';
    });
  });
  form.querySelectorAll('.zia-field input').forEach(function (i) {
    i.addEventListener('input', function () { i.closest('.zia-field').classList.remove('is-invalid'); });
  });
  form.elements.privacidad.addEventListener('change', function () {
    if (this.checked) this.closest('.zia-field').classList.remove('is-invalid');
  });

  // Estado → oficina asignada. nice-select (main.js) avisa del cambio por jQuery.
  function onEstado() {
    var sel = form.elements.estado;
    var o = officeFor(sel.value);
    sel.closest('.zia-field').classList.remove('is-invalid');
    assign.hidden = !o;
    updateResumen();
    if (!o) return;
    assign.querySelector('.zia-monogram').textContent = o.ini;
    assign.querySelector('.zia-assign__office').textContent = o.name;
    assign.querySelector('.zia-assign__name').textContent = o.who;
  }
  if (window.jQuery) jQuery(form.elements.estado).on('change', onEstado);
  else form.elements.estado.addEventListener('change', onEstado);
  // Casillas y opciones de urgencia: cambio nativo
  form.addEventListener('change', updateResumen);
  updateResumen();
  // Los distintivos del resumen son botones: tocar uno marca ese tema en el formulario
  if (resumen) {
    resumen.querySelectorAll('.zia-resumen__reg').forEach(function (r) {
      r.addEventListener('click', function () {
        if (form.hidden) return; // ya se envió: el resumen quedó como comprobante
        var box = Array.prototype.filter.call(form.querySelectorAll('input[name="temas"]'), function (c) { return c.value === r.dataset.tema; })[0];
        if (!box) return;
        box.checked = !box.checked;
        showError('temas', false);
        updateResumen();
      });
    });
  }

  // ['CNE','SAT','STPS'] → 'CNE, SAT y STPS'
  function enumerar(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1]; }

  function finish() {
    var o = officeFor(form.elements.estado.value);
    var nombre = form.elements.nombre.value.trim().split(/\s+/)[0];
    var prioridad = checked('urgencia')[0] === 'clausura' ? ' Su caso quedó marcado como urgente.' : '';
    root.querySelector('.zia-triage__summary').textContent =
      'Gracias, ' + nombre + '. ' + o.who + ' (oficina ' + o.name + ') revisará lo relacionado con ' +
      enumerar(checked('temas')) + ', y le contactará por teléfono o correo.' + prioridad;
    form.hidden = true;
    stepsUi.forEach(function (li) { li.classList.remove('is-current'); li.classList.add('is-done'); });
    done.hidden = false;
    requestAnimationFrame(function () { done.classList.add('is-shown'); });
    setResumenState('Solicitud recibida', true);
  }

  root.querySelector('.zia-triage__restart').addEventListener('click', function () {
    form.reset();
    if (window.jQuery && jQuery.fn.niceSelect) jQuery(form.elements.estado).niceSelect('update');
    assign.hidden = true;
    urgent.hidden = true;
    done.classList.remove('is-shown');
    done.hidden = true;
    form.hidden = false;
    show(1);
    updateResumen();
  });

  // Pre-llenado: desde CTAs de la página (data-tema, data-estado) o desde la URL (?tema=ASEA,SAT)
  function prefill(opts) {
    if (!form.hidden && step !== 1) show(1);
    var temas = opts.temas || [];
    if (opts.estado) {
      form.elements.estado.value = opts.estado;
      if (window.jQuery && jQuery.fn.niceSelect) jQuery(form.elements.estado).niceSelect('update');
      onEstado();
    }
    if (temas.length) {
      form.querySelectorAll('input[name="temas"]').forEach(function (c) { c.checked = temas.indexOf(c.value) !== -1; });
      showError('temas', false);
    }
    updateResumen();
  }
  window.ziaTriage = { prefill: prefill };
  var q = new URLSearchParams(location.search);
  if (q.get('tema')) prefill({ temas: q.get('tema').split(',').filter(Boolean) });
}());

/* ── Cobertura: zonas de atención en el mapa + "¿En qué estado está su estación?" ──
   Los puntos del mapa se reparten por la oficina más cercana (zona aproximada) y se
   encienden desde cada oficina al verse. El buscador usa la asignación del formulario. */
(function () {
  var sec = document.getElementById('cobertura');
  var map = sec && sec.querySelector('[data-zia-map]');
  var dotsPath = map && map.querySelector('.zia-map__dots');
  if (!dotsPath) return;
  var NS = 'http://www.w3.org/2000/svg';
  var hasGsap = typeof gsap !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var svg = dotsPath.ownerSVGElement;
  var pins = map.querySelectorAll('[data-office]');
  var cards = sec.querySelectorAll('[data-office-card]');

  // Centro de cada oficina activa (Culiacán "próximamente" no tiene zona propia)
  var centers = {};
  pins.forEach(function (p) {
    if (p.classList.contains('zia-map__pin--soon')) return;
    var m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(p.getAttribute('transform'));
    if (m) centers[p.dataset.office] = { x: +m[1], y: +m[2] };
  });
  var keys = Object.keys(centers);

  /* Cada punto del mapa se asigna al estado más cercano (centro aproximado de cada estado,
     lon/lat proyectados con la misma escala que los pines) y cada estado a su oficina con la
     asignación del formulario: así la zona iluminada coincide con quien atiende. */
  var EDOS = {
    'Aguascalientes': [-102.3, 21.9], 'Baja California': [-115.1, 30.5], 'Baja California Sur': [-111.9, 25.4],
    'Campeche': [-90.4, 19.0], 'Chiapas': [-92.6, 16.5], 'Chihuahua': [-106.1, 28.8], 'Ciudad de México': [-99.13, 19.4],
    'Coahuila': [-102.0, 27.3], 'Colima': [-103.9, 19.1], 'Durango': [-104.9, 24.6], 'Estado de México': [-99.6, 19.4],
    'Guanajuato': [-101.0, 21.0], 'Guerrero': [-99.9, 17.6], 'Hidalgo': [-98.9, 20.5], 'Jalisco': [-103.6, 20.6],
    'Michoacán': [-101.9, 19.2], 'Morelos': [-99.1, 18.7], 'Nayarit': [-104.9, 21.8], 'Nuevo León': [-99.9, 25.6],
    'Oaxaca': [-96.7, 17.0], 'Puebla': [-98.0, 19.0], 'Querétaro': [-99.9, 20.9], 'Quintana Roo': [-88.0, 19.6],
    'San Luis Potosí': [-100.4, 22.6], 'Sinaloa': [-107.5, 25.0], 'Sonora': [-110.6, 29.3], 'Tabasco': [-92.9, 17.9],
    'Tamaulipas': [-98.6, 24.3], 'Tlaxcala': [-98.2, 19.4], 'Veracruz': [-96.4, 19.5], 'Yucatán': [-89.0, 20.7],
    'Zacatecas': [-102.6, 23.0]
  };
  // Escala del mapa calculada con Tijuana y Orizaba (coincide con Morelia y Chihuahua)
  function proj(ll) { return { x: 32.05 * ll[0] + 3769, y: 1156 - 34.8 * ll[1] }; }
  var cob = window.ziaCobertura;
  var edoPts = {}, edoZone = {};
  Object.keys(EDOS).forEach(function (n) {
    edoPts[n] = proj(EDOS[n]);
    var o = cob && cob.officeFor(n);
    edoZone[n] = o ? o.key : 'morelia';
  });
  // Un path de puntos por estado, agrupados por zona, y un círculo de recorte que crece desde la oficina
  var segs = {}, maxR = {}, dotList = [];
  keys.forEach(function (k) { maxR[k] = 0; });
  dotsPath.getAttribute('d').replace(/M([-\d.]+) ([-\d.]+)h0/g, function (_, x, y) {
    x = +x; y = +y;
    var best = null, bd = Infinity;
    Object.keys(edoPts).forEach(function (n) { var d = Math.hypot(x - edoPts[n].x, y - edoPts[n].y); if (d < bd) { bd = d; best = n; } });
    (segs[best] = segs[best] || []).push('M' + x + ' ' + y + 'h0');
    dotList.push({ x: x, y: y, n: best });
    var k = edoZone[best], r = Math.hypot(x - centers[k].x, y - centers[k].y);
    if (r > maxR[k]) maxR[k] = r;
    return '';
  });
  var defs = document.createElementNS(NS, 'defs');
  svg.insertBefore(defs, svg.firstChild);
  var zones = {}, clips = {}, statePaths = {};
  keys.forEach(function (k) {
    var cp = document.createElementNS(NS, 'clipPath');
    cp.id = 'zia-zone-clip-' + k;
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', centers[k].x); c.setAttribute('cy', centers[k].y);
    c.setAttribute('r', (hasGsap && !reduced) ? 0 : maxR[k] + 20);
    cp.appendChild(c); defs.appendChild(cp);
    clips[k] = c;
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'zia-map__zone zia-map__zone--' + k);
    g.setAttribute('clip-path', 'url(#zia-zone-clip-' + k + ')');
    g.dataset.zone = k;
    dotsPath.parentNode.insertBefore(g, dotsPath);
    zones[k] = g;
  });
  Object.keys(segs).forEach(function (n) {
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', segs[n].join(''));
    p.setAttribute('class', 'zia-map__state');
    zones[edoZone[n]].appendChild(p);
    statePaths[n] = p;
  });
  dotsPath.remove();

  // Zona, pin y tarjeta resaltados juntos (null = todas por igual); estado opcional resaltado dentro de su zona
  function highlight(k, estado) {
    map.classList.toggle('has-focus', !!k);
    keys.forEach(function (z) { zones[z].classList.toggle('is-active', z === k); });
    Object.keys(statePaths).forEach(function (n) { statePaths[n].classList.toggle('is-state', n === estado); });
    pins.forEach(function (p) { p.classList.toggle('is-active', p.dataset.office === k); });
    cards.forEach(function (c) { c.classList.toggle('is-active', c.dataset.officeCard === k); });
  }
  // Lo elegido en el buscador se mantiene; el hover lo cambia solo mientras dura
  var picked = null, choose = null;
  function restore() { if (picked) highlight(picked.k, picked.n); else highlight(null); }
  pins.forEach(function (p) {
    ['mouseenter', 'focus', 'click'].forEach(function (ev) { p.addEventListener(ev, function () { highlight(p.dataset.office); }); });
    p.addEventListener('mouseleave', restore);
  });
  cards.forEach(function (c) {
    ['mouseenter', 'focus', 'click'].forEach(function (ev) { c.addEventListener(ev, function () { highlight(c.dataset.officeCard); }); });
    c.addEventListener('mouseleave', restore);
  });
  // zia.js marca la primera oficina al cargar; aquí se arranca con todas las zonas por igual
  highlight(null);

  /* Hover y clic sobre cualquier parte del mapa: el estado bajo el cursor (punto más cercano)
     resalta su zona; el clic lo elige en el buscador. Etiqueta flotante con estado y oficina. */
  var tip = document.createElement('div');
  tip.className = 'zia-map__tip';
  tip.hidden = true;
  map.appendChild(tip);
  function stateAt(e) {
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var ctm = svg.getScreenCTM(); if (!ctm) return null;
    var p = pt.matrixTransform(ctm.inverse()), best = null, bd = 18 * 18; // a menos de ~1.5 puntos
    for (var i = 0; i < dotList.length; i++) {
      var dx = dotList[i].x - p.x, dy = dotList[i].y - p.y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = dotList[i].n; }
    }
    return best;
  }
  var hoverN = null, raf = 0;
  function hideTip() { tip.hidden = true; map.style.cursor = ''; }
  svg.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    if (e.target.closest && e.target.closest('[data-office]')) { hoverN = null; hideTip(); return; }
    var cx = e.clientX, cy = e.clientY, ev = { clientX: cx, clientY: cy };
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      var n = stateAt(ev);
      if (!n) { if (hoverN) { hoverN = null; restore(); } hideTip(); return; }
      if (n !== hoverN) {
        hoverN = n;
        highlight(edoZone[n], n);
        var o = cob && cob.officeFor(n);
        tip.innerHTML = '<b>' + n + '</b>' + (o ? 'Oficina ' + o.name : '');
      }
      var r = map.getBoundingClientRect();
      tip.style.left = (cx - r.left) + 'px';
      tip.style.top = (cy - r.top) + 'px';
      tip.hidden = false;
      map.style.cursor = 'pointer';
    });
  });
  svg.addEventListener('pointerleave', function () { cancelAnimationFrame(raf); hoverN = null; hideTip(); restore(); });
  svg.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-office]')) return;
    var n = stateAt(e);
    if (n && choose) choose(n);
  });

  /* Buscador por estado */
  var sel = document.getElementById('zia-finder-estado');
  var formSel = document.getElementById('t-estado');
  var result = sec.querySelector('.zia-finder__result');
  if (sel && formSel) {
    Array.prototype.slice.call(formSel.options, 1).forEach(function (o) { sel.add(new Option(o.text, o.value || o.text)); });
    if (window.jQuery && jQuery.fn.niceSelect) jQuery(sel).niceSelect('update');
    var mono = result.querySelector('.zia-monogram'), who = result.querySelector('.zia-finder__who');
    var cta = result.querySelector('.zia-finder__cta');
    var onPick = function () {
      var o = window.ziaCobertura && window.ziaCobertura.officeFor(sel.value);
      if (!o) return;
      mono.textContent = o.ini;
      mono.classList.remove('zia-monogram--gold');
      who.querySelector('small').textContent = 'Le atiende en ' + sel.value;
      who.querySelector('b').textContent = o.who;
      who.querySelector('.zia-finder__office').textContent = 'Oficina ' + o.name + ' · ' + o.zone;
      cta.hidden = false;
      cta.dataset.estado = sel.value;
      cta.querySelector('.btn-text span').textContent = 'Hablar con ' + o.who.split(' ')[1];
      result.classList.add('is-match');
      picked = { k: o.key, n: sel.value };
      highlight(o.key, sel.value);
      // Se anima el contenedor (div): main.css da transition a sus hijos y chocaría con GSAP
      if (hasGsap && !reduced) gsap.fromTo(result, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .4, ease: 'power2.out', clearProps: 'opacity,transform' });
    };
    if (window.jQuery) jQuery(sel).on('change', onPick); else sel.addEventListener('change', onPick);
    // Clic en el mapa = elegir ese estado en el buscador
    choose = function (n) {
      sel.value = n;
      if (window.jQuery && jQuery.fn.niceSelect) jQuery(sel).niceSelect('update');
      onPick();
    };
  }

  // Al verse por primera vez, las zonas se encienden desde cada oficina hacia afuera
  if (hasGsap && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (en) { return en.isIntersecting; })) return;
      io.disconnect();
      keys.forEach(function (k, i) {
        gsap.to(clips[k], { attr: { r: maxR[k] + 20 }, duration: 1.8, delay: .2 + i * .18, ease: 'power2.out' });
      });
      // Solo opacidad y radio: los pines se ubican con transform="translate(...)" y no se deben mover
      gsap.fromTo(pins, { opacity: 0 }, { opacity: 1, duration: .4, stagger: .12, delay: .1 });
      gsap.fromTo(map.querySelectorAll('.zia-map__core'), { attr: { r: 0 } }, { attr: { r: 11 }, duration: .55, stagger: .12, ease: 'back.out(2.6)', delay: .1 });
    }, { threshold: .35 });
    io.observe(map);
  }
}());

(function () {
  /* ── Anclas internas con ScrollSmoother + CTAs que pre-llenan el formulario ── */
  function goTo(hash) {
    var target = document.querySelector(hash);
    if (!target) return;
    var smoother = window.ScrollSmoother && ScrollSmoother.get && ScrollSmoother.get();
    if (smoother) smoother.scrollTo(target, true, 'top 20px');
    else target.scrollIntoView({ behavior: 'smooth' });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains('video-popup') || a.getAttribute('href').length < 2) return;
    e.preventDefault();
    if ((a.dataset.tema || a.dataset.estado) && window.ziaTriage) {
      window.ziaTriage.prefill({ temas: (a.dataset.tema || '').split(',').filter(Boolean), estado: a.dataset.estado });
    }
    goTo(a.getAttribute('href'));
  });

  /* ── Header: fondo sólido en cuanto se deja el hero ── */
  var header = document.querySelector('.zia-lp-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-solid', window.scrollY > 80); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Navegación lateral por puntos: marca la sección visible ── */
  var dots = document.querySelectorAll('.zia-dots a');
  if (dots.length && typeof ScrollTrigger !== 'undefined') {
    dots.forEach(function (dot) {
      var sec = document.querySelector(dot.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 55%', end: 'bottom 55%',
        onToggle: function (self) {
          if (!self.isActive) return;
          dots.forEach(function (d) { d.classList.toggle('is-active', d === dot); });
          // Sobre secciones claras los puntos cambian a tinta oscura
          document.body.classList.toggle('zia-on-light', sec.classList.contains('zia-sec--light'));
        }
      });
    });
  }

  /* ── Móvil y tablet vertical: imán entre secciones ──
     Dentro de una sección larga el scroll es libre; al detenerse a menos de
     30% de pantalla del inicio de una sección, la página se alinea con ella.
     CSS scroll-snap no aplica (ScrollSmoother mueve el contenido con transform) y
     el snap de ScrollTrigger lee mal el avance con ScrollSmoother, así que se
     alinea a mano cuando el scroll termina. */
  var mq = window.matchMedia('(max-width: 991px)');
  var secs = Array.prototype.slice.call(document.querySelectorAll('main .zia-sec'));
  var touching = false, endTimer = null, gestureStartY = null;
  var smootherNow = function () { return window.ScrollSmoother && ScrollSmoother.get && ScrollSmoother.get(); };
  var sectionTop = function (el) {
    var sm = smootherNow();
    return sm ? sm.offset(el, 'top top') : el.getBoundingClientRect().top + window.scrollY;
  };
  var snapToNearest = function () {
    var y = window.scrollY, range = window.innerHeight * 0.3, best = null;
    // Solo atrae en la dirección del gesto: bajar un poco desde el inicio de una sección no te regresa
    var dir = gestureStartY === null ? 0 : y - gestureStartY;
    gestureStartY = null;
    if (!mq.matches || touching || !secs.length) return;
    // No mover la página mientras se escribe en el formulario (el teclado cambia el alto)
    var a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    secs.forEach(function (s) {
      var t = sectionTop(s);
      if ((dir > 0 && t < y) || (dir < 0 && t > y)) return;
      if (Math.abs(t - y) < range && (best === null || Math.abs(t - y) < Math.abs(best - y))) best = t;
    });
    if (best === null || Math.abs(best - y) < 4) return;
    gestureStartY = best; // el propio desplazamiento del imán no cuenta como gesto nuevo
    var sm = smootherNow();
    if (sm) sm.scrollTo(best, true);
    else window.scrollTo({ top: best, behavior: 'smooth' });
  };
  // Fin del scroll = 160ms sin eventos y sin dedo en pantalla (incluye la inercia del swipe)
  var scheduleSnap = function () {
    if (gestureStartY === null) gestureStartY = lastY;
    lastY = window.scrollY;
    clearTimeout(endTimer); endTimer = setTimeout(snapToNearest, 160);
  };
  var lastY = window.scrollY;
  window.addEventListener('scroll', scheduleSnap, { passive: true });
  window.addEventListener('touchstart', function () { touching = true; clearTimeout(endTimer); }, { passive: true });
  window.addEventListener('touchend', function () { touching = false; scheduleSnap(); }, { passive: true });
  window.addEventListener('touchcancel', function () { touching = false; scheduleSnap(); }, { passive: true });
}());
