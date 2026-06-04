(function () {

  /* ── HAMBURGER NAV ── */
  var toggle  = document.getElementById('nav-toggle');
  var menu    = document.getElementById('nav-menu');
  var overlay = document.getElementById('nav-overlay');

  if (toggle && menu && overlay) {
    function openNav() {
      menu.classList.add('is-open');
      overlay.classList.add('is-open');
      toggle.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function closeNav() {
      menu.classList.remove('is-open');
      overlay.classList.remove('is-open');
      toggle.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    toggle.addEventListener('click', function () {
      menu.classList.contains('is-open') ? closeNav() : openNav();
    });
    overlay.addEventListener('click', closeNav);
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeNav);
    });
  }

  /* ── DIAGNÓSTICO INTERACTIVO ── */
  var answers = {};

  var REGS = [
    { org: 'SAT',  okText: 'Control volumétrico activo y reportando',   riskText: 'Sin control volumétrico activo',        href: 'servicios.html#sat'      },
    { org: 'CRE',  okText: 'Permiso vigente y sin observaciones',        riskText: 'Permiso con observaciones pendientes',  href: 'servicios.html#gestoria' },
    { org: 'ASEA', okText: 'SASISOPA y Cédula de Operación vigentes',    riskText: 'Sin SASISOPA o Cédula vencida',         href: 'servicios.html#gestoria' }
  ];

  var LEVELS = [
    { key: 'ok',       label: 'Nivel: Bajo',     icon: '✓', title: 'Buen nivel de cumplimiento',                            desc: 'Aun así, le recomendamos una Auditoría Preventiva anual para anticiparse a cambios normativos antes de que actúen las autoridades.' },
    { key: 'medium',   label: 'Nivel: Medio',    icon: '⚠', title: '1 área de riesgo detectada',                           desc: 'Este incumplimiento puede derivar en multas o sanciones. Le recomendamos atenderlo antes de una inspección sorpresa.' },
    { key: 'high',     label: 'Nivel: Alto',     icon: '⚠', title: '2 áreas de riesgo regulatorio detectadas',             desc: 'Estos incumplimientos lo exponen a multas, clausura o pérdida de permiso. Actúe con urgencia.' },
    { key: 'critical', label: 'Nivel: Crítico',  icon: '!', title: 'Riesgo crítico: 3 áreas sin cumplimiento',             desc: 'Su gasolinera está expuesta a clausura inmediata, embargo fiscal y pérdida de permiso. Contáctenos hoy.' }
  ];

  function diagBar(step) {
    var bar = document.getElementById('diag-bar');
    if (bar) bar.style.width = (step / 3 * 100) + '%';
  }

  function diagShowQ(n) {
    for (var i = 1; i <= 3; i++) {
      var ds = document.getElementById('ds-' + i);
      if (ds) {
        ds.classList.toggle('is-active', i === n);
        ds.classList.toggle('is-done', i < n);
        var dot = ds.querySelector('.diag-step__dot');
        if (dot) dot.textContent = i < n ? '✓' : String(i);
      }
    }

    var currentEl = null;
    for (var j = 1; j <= 3; j++) {
      var candidate = document.getElementById('dq-' + j);
      if (candidate && candidate.style.display !== 'none') { currentEl = candidate; break; }
    }

    var nextEl = document.getElementById('dq-' + n);
    if (!nextEl) return;

    diagBar(n - 1);

    if (currentEl && currentEl !== nextEl) {
      currentEl.classList.add('diag-question-leaving');
      var captured = currentEl;
      setTimeout(function () {
        captured.style.display = 'none';
        captured.classList.remove('diag-question-leaving');
        nextEl.style.display = 'block';
        void nextEl.offsetWidth;
        nextEl.classList.add('diag-question-entering');
        setTimeout(function () { nextEl.classList.remove('diag-question-entering'); }, 300);
      }, 190);
    } else {
      nextEl.style.display = 'block';
      void nextEl.offsetWidth;
      nextEl.classList.add('diag-question-entering');
      setTimeout(function () { nextEl.classList.remove('diag-question-entering'); }, 300);
    }
  }

  function diagResult() {
    var qWrap = document.getElementById('diag-questions');
    var rWrap = document.getElementById('diag-result');
    if (!qWrap || !rWrap) return;

    for (var i = 1; i <= 3; i++) {
      var ds = document.getElementById('ds-' + i);
      if (ds) {
        ds.classList.remove('is-active');
        ds.classList.add('is-done');
        var dot = ds.querySelector('.diag-step__dot');
        if (dot) dot.textContent = '✓';
      }
    }
    diagBar(3);

    qWrap.style.display = 'none';
    rWrap.style.display = 'block';
    void rWrap.offsetWidth;
    rWrap.classList.add('diag-question-entering');
    setTimeout(function () { rWrap.classList.remove('diag-question-entering'); }, 300);

    var issueCount = 0;
    if (answers[1] === 'no') issueCount++;
    if (answers[2] === 'no') issueCount++;
    if (answers[3] === 'no') issueCount++;

    var level = LEVELS[issueCount];

    var riskEl = document.getElementById('diag-risk-level');
    if (riskEl) {
      riskEl.innerHTML =
        '<span class="diag-risk-badge diag-risk-badge--' + level.key + '">' +
        '<span class="diag-risk-dot"></span>' + level.label + '</span>';
    }

    var icon = document.getElementById('diag-icon');
    if (icon) {
      icon.textContent = level.icon;
      icon.className = 'diag-result__icon diag-result__icon--' + level.key;
    }

    var title = document.getElementById('diag-title');
    var desc  = document.getElementById('diag-desc');
    if (title) title.textContent = level.title;
    if (desc)  desc.textContent  = level.desc;

    var regsEl = document.getElementById('diag-regulators');
    if (regsEl) {
      var html = '<div class="diag-reg-rows">';
      for (var k = 0; k < 3; k++) {
        var r   = REGS[k];
        var isOk = answers[k + 1] !== 'no';
        html +=
          '<div class="diag-reg-row diag-reg-row--' + (isOk ? 'ok' : 'risk') + '">' +
          '<div class="diag-reg-row__status-dot">' + (isOk ? '✓' : '✕') + '</div>' +
          '<div class="diag-reg-row__label">' +
          '<div class="diag-reg-row__org">' + r.org + '</div>' +
          '<div class="diag-reg-row__detail">' + (isOk ? r.okText : r.riskText) + '</div>' +
          '</div>' +
          (!isOk ? '<a href="' + r.href + '" class="diag-reg-row__link">Resolver →</a>' : '') +
          '</div>';
      }
      html += '</div>';
      regsEl.innerHTML = html;
    }
  }

  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('diag-btn')) {
      var q   = parseInt(e.target.getAttribute('data-q'), 10);
      var ans = e.target.getAttribute('data-ans');
      answers[q] = ans;
      if (q < 3) { diagShowQ(q + 1); } else { diagResult(); }
    }
    if (e.target.id === 'diag-restart') {
      answers = {};
      var qWrap = document.getElementById('diag-questions');
      var rWrap = document.getElementById('diag-result');
      if (qWrap) qWrap.style.display = 'block';
      if (rWrap) rWrap.style.display = 'none';
      diagShowQ(1);
    }
  });

  if (document.getElementById('dq-1')) diagBar(0);

  /* ── MAPA INTERACTIVO DE OFICINAS ── */
  var OFFICES = {
    'MX-BCN': { city: 'Tijuana',   region: 'Oficina Noroeste', name: 'Mtra. Alma Estrella Domínguez', phone: '664 159 4369', key: 'tijuana' },
    'MX-CHH': { city: 'Chihuahua', region: 'Oficina Norte',    name: 'Ing. Alejandro Vela',           phone: '614 471 8727', key: 'chihuahua' },
    'MX-SIN': { city: 'Culiacán',  region: 'Oficina Sinaloa',  name: 'Ing. Jaziel Cienfuegos',        pending: true,          key: 'culiacan' },
    'MX-MIC': { city: 'Morelia',   region: 'Oficina Centro',   name: 'Ing. Edilberto Brito',          phone: '443 328 0991', key: 'morelia' },
    'MX-VER': { city: 'Orizaba',   region: 'Oficina Oriente',  name: 'Ing. Francisco Santos',         phone: '272 215 8160', key: 'orizaba' }
  };

  function activateOffice(key) {
    document.querySelectorAll('.office-row').forEach(function (el) { el.classList.remove('is-active'); });
    var card = document.querySelector('.office-row[data-office="' + key + '"]');
    if (card) card.classList.add('is-active');
    var wrap = document.getElementById('mexico-map');
    if (wrap) {
      wrap.querySelectorAll('path').forEach(function (p) { p.classList.remove('map-state--active'); });
      Object.keys(OFFICES).forEach(function (id) {
        if (OFFICES[id].key === key) {
          var p = wrap.querySelector('#' + id);
          if (p) p.classList.add('map-state--active');
        }
      });
    }
  }

  function deactivateOffices() {
    document.querySelectorAll('.office-row').forEach(function (el) { el.classList.remove('is-active'); });
    var wrap = document.getElementById('mexico-map');
    if (wrap) wrap.querySelectorAll('path').forEach(function (p) { p.classList.remove('map-state--active'); });
  }

  function positionTooltip(e, wrap, tooltip) {
    var rect  = wrap.getBoundingClientRect();
    var x     = e.clientX - rect.left;
    var y     = e.clientY - rect.top;
    var flip  = x + 220 > rect.width;
    tooltip.style.transform = flip ? 'translate(calc(-100% - 14px), -50%)' : 'translate(14px, -50%)';
    tooltip.style.left = x + 'px';
    tooltip.style.top  = y + 'px';
  }

  function initOfficeMap() {
    var wrap    = document.getElementById('mexico-map');
    var tooltip = document.getElementById('map-tooltip');
    if (!wrap || !tooltip) return;

    fetch('assets/img/mexico.svg')
      .then(function (r) { return r.text(); })
      .then(function (svgText) {
        tooltip.insertAdjacentHTML('beforebegin', svgText);
        var svg = wrap.querySelector('svg');
        if (!svg) return;
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('viewBox', '0 0 792.41846 497.54324');

        svg.querySelectorAll('path').forEach(function (path) {
          var data = OFFICES[path.id];
          if (data) path.classList.add(data.pending ? 'map-state--pending' : 'map-state--office');

          if (!data) return;

          path.addEventListener('mouseenter', function (e) {
            path.classList.add('map-state--hover');
            tooltip.innerHTML =
              '<div class="map-tooltip__city">'   + data.city   + '</div>' +
              '<div class="map-tooltip__region">' + data.region + '</div>' +
              '<div class="map-tooltip__name">'   + data.name   + '</div>' +
              (data.pending
                ? '<div class="map-tooltip__pending">Datos de contacto pendientes</div>'
                : '<div class="map-tooltip__phone">' + data.phone + '</div>');
            positionTooltip(e, wrap, tooltip);
            tooltip.classList.add('is-visible');
            activateOffice(data.key);
          });
          path.addEventListener('mousemove',  function (e) { positionTooltip(e, wrap, tooltip); });
          path.addEventListener('mouseleave', function () {
            path.classList.remove('map-state--hover');
            tooltip.classList.remove('is-visible');
            deactivateOffices();
          });
          path.addEventListener('click', function () {
            if (data.pending) return;
            var card = document.querySelector('.office-row[data-office="' + data.key + '"]');
            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
        });
      })
      .catch(function () { /* file:// sin servidor: mapa estático, sin interacción */ });
  }

  document.querySelectorAll('.office-row[data-office]').forEach(function (card) {
    card.addEventListener('mouseenter', function () { activateOffice(this.dataset.office); });
    card.addEventListener('mouseleave', deactivateOffices);
    card.addEventListener('touchstart', function () { activateOffice(this.dataset.office); }, { passive: true });
    card.addEventListener('touchend',   deactivateOffices, { passive: true });
  });

  initOfficeMap();

  /* ── INSTRUCCIÓN DEL MAPA: adaptar a touch ── */
  var officeInstruction = document.querySelector('.offices-panel__instruction');
  if (officeInstruction && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    officeInstruction.textContent = 'Toque una oficina para ver sus datos de contacto.';
  }

  /* ── FORMULARIO DE CONTACTO ── */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var required = contactForm.querySelectorAll('[required]');
      var valid = true;
      required.forEach(function (field) {
        if (!field.value.trim()) {
          field.style.borderColor = '#c00';
          valid = false;
        } else {
          field.style.borderColor = '';
        }
      });
      if (!valid) return;
      var btn = contactForm.querySelector('[type="submit"]');
      if (btn) { btn.textContent = 'Enviando…'; btn.disabled = true; }
      setTimeout(function () {
        contactForm.innerHTML =
          '<div style="text-align:center;padding:32px 0">' +
          '<div style="font-size:32px;margin-bottom:12px">✓</div>' +
          '<div style="font-size:16px;font-weight:800;color:#222;margin-bottom:8px">Solicitud enviada</div>' +
          '<p style="font-size:13px;color:#6b6b6b">Le contactaremos en menos de 2 horas en horario hábil.</p>' +
          '</div>';
      }, 600);
    });
  }

}());
