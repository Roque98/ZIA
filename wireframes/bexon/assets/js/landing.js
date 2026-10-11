/* ═══════════════════════════════════════════════════
   ZIA — Landing única (wireframes/bexon/index.html)
   Reúne lo que antes vivía en home, servicios, nosotros y contacto.
   Cada módulo es independiente: si su marcado no existe, no hace nada.
═══════════════════════════════════════════════════ */

/* ── Calculadora de exposición ── */
(function () {
  var state = { d: 4, v: 2 };
  var VM = [250000, 750000, 2000000, 4000000, 7000000];

  function calc() {
    var d = state.d, v = VM[state.v - 1];
    return {
      sat:  { mn: 500000 + d * 100000,          mx: 3000000 + d * 250000 + v * 0.03 },
      asea: { mn: 200000 + d * 80000,            mx: 1500000 + d * 200000 },
      cre:  { mn: 100000 + v * 0.02,             mx: Math.min(3000000 + v * 0.05, 8000000) },
      stps: { mn: d * 5 * 5000,                  mx: d * 5 * 25000 }
    };
  }

  function fmt(n) {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    return '$' + Math.round(n / 1000) + 'K';
  }

  function render() {
    var r = calc();
    var ids = { sat: r.sat, asea: r.asea, cre: r.cre, stps: r.stps };
    var tMin = 0, tMax = 0;
    Object.keys(ids).forEach(function (k) {
      tMin += ids[k].mn; tMax += ids[k].mx;
      set('r-' + k + '-min', fmt(ids[k].mn));
      set('r-' + k + '-max', fmt(ids[k].mx));
    });
    set('r-total-min', fmt(tMin));
    set('r-total-max', fmt(tMax));
    var cta = document.querySelector('.zia-calc-cta-row a');
    // El CTA lleva la estimación al formulario de la misma página (ver ziaTriage.prefill)
    if (cta) { cta.dataset.origen = 'calculadora'; cta.dataset.desp = state.d; cta.dataset.exp = fmt(tMin) + ' a ' + fmt(tMax); }
    document.getElementById('calc-disp').textContent = state.d;
  }

  function set(id, val) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = val;
    el.classList.add('is-live');
  }

  var minus = document.getElementById('calc-minus');
  var plus  = document.getElementById('calc-plus');
  if (minus) minus.addEventListener('click', function () { if (state.d > 1)  { state.d--; render(); } });
  if (plus)  plus.addEventListener('click',  function () { if (state.d < 30) { state.d++; render(); } });

  document.querySelectorAll('#calc-ventas .zia-calc-opt').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('#calc-ventas .zia-calc-opt').forEach(function (b) { b.classList.remove('is-sel'); });
      btn.classList.add('is-sel');
      state.v = parseInt(btn.dataset.v, 10);
      render();
    });
  });

  render();
}());

/* ── Proceso: rail animado ── */
(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  var fill  = document.getElementById('process-fill');
  var dots  = document.querySelectorAll('.zia-process-v2__dot');
  var steps = document.querySelectorAll('.zia-process-v2__step');
  if (!fill || !dots.length) return;
  var thresholds = [0, 0.32, 0.64, 0.97];
  gsap.to(fill, {
    width: '100%',
    ease: 'none',
    scrollTrigger: {
      trigger: '#zia-process-v2',
      start: 'top 85%',
      // Completo en cuanto el bloque entero está a la vista (las secciones caben en una pantalla)
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: function (self) {
        var p = self.progress;
        dots.forEach(function (dot, i) {
          var active = p >= thresholds[i];
          dot.classList.toggle('is-active', active);
          steps[i].classList.toggle('is-visible', active);
        });
      },
      onEnter: function () {
        dots[0].classList.add('is-active');
        steps[0].classList.add('is-visible');
      }
    }
  });
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
    electrica:       { k: 'Instalación eléctrica', t: 'NOM-001-SEDE-2012',        d: 'Verificación eléctrica, iluminación, ruido y energía estática.', tema: 'STPS' },
    seguridad:       { k: 'Operación',           t: 'SASISOPA y emergencias',     d: 'Análisis de riesgo, protocolo de respuesta y licencia de funcionamiento.', tema: 'ASEA,Protección Civil' }
  };
  var station = document.getElementById('zia-station');
  if (station) {
    var svg = station.querySelector('svg');
    var tip = station.querySelector('.zia-station__tip');
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

    function show(id) {
      var data = PUNTOS[id];
      var pt = svg.querySelector('.pt[data-punto="' + id + '"]');
      if (!data || !pt) return;
      current = id;
      svg.querySelectorAll('.pt').forEach(function (p) { p.classList.toggle('is-active', p === pt); });
      legend.forEach(function (b) { b.classList.toggle('is-active', b.dataset.punto === id); });
      tip.querySelector('.zia-station__tip-kicker').textContent = data.k;
      tip.querySelector('.zia-station__tip-title').textContent = data.t;
      tip.querySelector('.zia-station__tip-desc').textContent = data.d;
      tip.querySelector('.zia-station__tip-link').dataset.tema = data.tema;
      tip.hidden = false;

      // Posición: sobre el punto; debajo si no cabe arriba; dentro del contenedor a lo ancho
      var box = station.getBoundingClientRect(), r = pt.getBoundingClientRect();
      var x = r.left + r.width / 2 - box.left, y = r.top + r.height / 2 - box.top;
      var half = tip.offsetWidth / 2, pad = 8;
      var cx = Math.max(half + pad, Math.min(box.width - half - pad, x));
      var below = y - tip.offsetHeight - 30 < 0;
      tip.classList.toggle('is-below', below);
      tip.style.left = cx + 'px';
      tip.style.top = y + 'px';
      tip.style.setProperty('--arrow', (half + x - cx) + 'px');
      if (hasGsap && !reduced) gsap.fromTo(tip, { opacity: 0 }, { opacity: 1, duration: .25, clearProps: 'opacity' });
    }
    function stopAuto() { userTook = true; clearInterval(timer); }

    svg.querySelectorAll('.pt').forEach(function (pt) {
      ['mouseenter', 'focus', 'click'].forEach(function (ev) {
        pt.addEventListener(ev, function () { stopAuto(); show(pt.dataset.punto); });
      });
    });
    legend.forEach(function (b) {
      ['mouseenter', 'click'].forEach(function (ev) {
        b.addEventListener(ev, function () { stopAuto(); show(b.dataset.punto); });
      });
    });
    window.addEventListener('resize', function () { if (current) show(current); });

    // Recorrido automático mientras la cabecera está a la vista y nadie interactúa
    if (!reduced) {
      var i = 0;
      var cycle = function () { show(ids[i % ids.length]); i++; };
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          clearInterval(timer);
          if (en.isIntersecting && !userTook) { cycle(); timer = setInterval(cycle, 3200); }
        });
      }, { threshold: .4 }).observe(station);
    } else {
      show(ids[0]);
    }
  }
}());

/* ── Ficha de cada regulador (modal desde la franja del hero) ──
   Contenido tomado de docs/client-brief.md. "spots" son los puntos de la
   estación interactiva donde aplica cada autoridad; "calc" enlaza con la
   fila de la calculadora de exposición. */
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
      calc: 'asea', tema: 'ASEA'
    },
    cre: {
      abbr: 'CRE', name: 'Comisión Reguladora de Energía', icon: 'cre',
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
      calc: 'cre', tema: 'CRE'
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
      calc: 'sat', tema: 'SAT'
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
      calc: 'stps', tema: 'STPS'
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
      risk: null, calc: null, tema: 'Protección Civil'
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

  // Mini estación: copia de la ilustración de la sección 2 (ids renombrados para no duplicarlos)
  function buildMini() {
    var src = document.querySelector('#zia-station svg');
    var wrap = $('.zia-reg-modal__station');
    if (!src || !wrap) return null;
    var svg = src.cloneNode(true);
    svg.removeAttribute('role');
    svg.setAttribute('aria-hidden', 'true');
    svg.querySelectorAll('[id]').forEach(function (el) { el.id = 'mini-' + el.id; });
    svg.querySelectorAll('[clip-path]').forEach(function (el) {
      el.setAttribute('clip-path', el.getAttribute('clip-path').replace('url(#', 'url(#mini-'));
    });
    svg.querySelectorAll('.pt').forEach(function (pt) {
      pt.classList.remove('is-active');
      pt.removeAttribute('tabindex'); pt.removeAttribute('role'); pt.removeAttribute('aria-label');
    });
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
    // Exposición: la misma cifra que muestra la calculadora con sus valores actuales
    var exp = $('.zia-reg-modal__exposure');
    var mn = r.calc && document.getElementById('r-' + r.calc + '-min');
    var mx = r.calc && document.getElementById('r-' + r.calc + '-max');
    var hasExp = mn && mx && mn.textContent.indexOf('$') === 0;
    exp.hidden = !hasExp;
    if (hasExp) exp.querySelector('strong').textContent = mn.textContent + ' – ' + mx.textContent;

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
    // Los enlaces internos (formulario, calculadora) cierran la ficha antes de desplazar la página
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

/* ── Cifras animadas ── */
(function () {
  if (typeof gsap === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.zia-figure b[data-count]').forEach(function (el, i) {
    var end = +el.dataset.count;
    // El año arranca cerca de su valor para que no "cuente" desde cero
    var obj = { v: el.hasAttribute('data-plain') ? end - 40 : 0 };
    el.textContent = Math.round(obj.v);
    gsap.to(obj, {
      v: end, duration: 1.6, delay: .5 + i * .12, ease: 'power3.out',
      onUpdate: function () { el.textContent = Math.round(obj.v); }
    });
  });
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
    tijuana:   { name: 'Tijuana',   who: 'Mtra. Alma Estrella Domínguez', ini: 'AE' },
    chihuahua: { name: 'Chihuahua', who: 'Ing. Alejandro Vela',           ini: 'AV' },
    morelia:   { name: 'Morelia',   who: 'Ing. Edilberto Brito',          ini: 'EB' },
    orizaba:   { name: 'Orizaba',   who: 'Ing. Francisco Santos',         ini: 'FS' }
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

  function checked(name) {
    return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
  }
  function showError(name, on) {
    var e = root.querySelector('[data-error="' + name + '"]');
    if (e) e.hidden = !on;
  }

  function show(n) {
    step = n;
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

  // Estado → oficina asignada. nice-select (main.js) avisa del cambio por jQuery.
  function onEstado() {
    var sel = form.elements.estado;
    var o = officeFor(sel.value);
    sel.closest('.zia-field').classList.remove('is-invalid');
    assign.hidden = !o;
    if (!o) return;
    assign.querySelector('.zia-monogram').textContent = o.ini;
    assign.querySelector('.zia-assign__office').textContent = o.name;
    assign.querySelector('.zia-assign__name').textContent = o.who;
  }
  if (window.jQuery) jQuery(form.elements.estado).on('change', onEstado);
  else form.elements.estado.addEventListener('change', onEstado);

  // ['CRE','SAT','STPS'] → 'CRE, SAT y STPS'
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
  });

  // Pre-llenado: desde CTAs de la página (data-tema / data-origen) o desde la URL (?tema=ASEA,SAT)
  function prefill(opts) {
    if (!form.hidden && step !== 1) show(1);
    var temas = opts.temas || [];
    if (opts.origen === 'calculadora') {
      temas = ['ASEA', 'CRE', 'SAT', 'STPS'];
      form.elements.mensaje.value = 'Vengo de la calculadora de exposición: ' + (opts.desp || '?') +
        ' dispensarios, exposición estimada ' + (opts.exp || 'no indicada') + '.';
    }
    if (temas.length) {
      form.querySelectorAll('input[name="temas"]').forEach(function (c) { c.checked = temas.indexOf(c.value) !== -1; });
      showError('temas', false);
    }
  }
  window.ziaTriage = { prefill: prefill };
  var q = new URLSearchParams(location.search);
  if (q.get('tema') || q.get('origen')) {
    prefill({ temas: (q.get('tema') || '').split(',').filter(Boolean), origen: q.get('origen'), desp: q.get('desp'), exp: q.get('exp') });
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
    if ((a.dataset.tema || a.dataset.origen) && window.ziaTriage) {
      window.ziaTriage.prefill({
        temas: (a.dataset.tema || '').split(',').filter(Boolean),
        origen: a.dataset.origen, desp: a.dataset.desp, exp: a.dataset.exp
      });
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
