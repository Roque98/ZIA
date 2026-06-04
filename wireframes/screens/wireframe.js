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

  function diagBar(step) {
    var bar = document.getElementById('diag-bar');
    if (bar) bar.style.width = (step / 3 * 100) + '%';
  }

  function diagShowQ(n) {
    for (var i = 1; i <= 3; i++) {
      var el = document.getElementById('dq-' + i);
      if (el) el.style.display = (i === n) ? 'block' : 'none';
    }
    diagBar(n - 1);
  }

  function diagResult() {
    var qWrap  = document.getElementById('diag-questions');
    var rWrap  = document.getElementById('diag-result');
    if (!qWrap || !rWrap) return;

    diagBar(3);
    qWrap.style.display = 'none';
    rWrap.style.display = 'block';

    var issues = [];
    if (answers[1] === 'no') issues.push({ label: 'Servicios Fiscales SAT', href: 'servicios.html#sat' });
    if (answers[2] === 'no') issues.push({ label: 'Gestoría CRE', href: 'servicios.html#gestoria' });
    if (answers[3] === 'no') issues.push({ label: 'Gestoría ASEA', href: 'servicios.html#gestoria' });

    var icon  = document.getElementById('diag-icon');
    var title = document.getElementById('diag-title');
    var desc  = document.getElementById('diag-desc');
    var svcs  = document.getElementById('diag-services');

    if (issues.length === 0) {
      if (icon)  icon.textContent  = '✓';
      if (title) title.textContent = 'Buen nivel de cumplimiento';
      if (desc)  desc.textContent  = 'Aun así, le recomendamos una Auditoría Preventiva anual para anticiparse a cambios normativos antes de que actúen las autoridades.';
      if (svcs)  svcs.innerHTML    = '<span class="tag">Auditoría preventiva</span><span class="tag">Supervisión continua</span>';
    } else {
      if (icon)  icon.textContent  = '⚠';
      if (title) title.textContent = 'Detectamos ' + issues.length + ' área' + (issues.length > 1 ? 's' : '') + ' de riesgo regulatorio';
      if (desc)  desc.textContent  = 'Estos incumplimientos pueden derivar en multas, clausuras o pérdida de permiso. Le recomendamos atenderlos con urgencia.';
      if (svcs) {
        svcs.innerHTML = issues.map(function (s) {
          return '<a href="' + s.href + '" class="tag" style="text-decoration:none">' + s.label + ' →</a>';
        }).join('');
      }
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

}());
