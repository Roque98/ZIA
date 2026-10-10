/* ═══════════════════════════════════════════════════
   ZIA — Comportamiento compartido (Propuesta 02)
   Cargar después de main.js. Cada módulo es opcional:
   si su marcado no existe en la página, no hace nada.
═══════════════════════════════════════════════════ */
(function () {
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ── Línea de tiempo: track que se rellena + activación de hitos ── */
  document.querySelectorAll('.zia-tl').forEach(function (tl) {
    var fill  = tl.querySelector('.zia-tl__fill');
    var items = tl.querySelectorAll('.zia-tl__item');
    if (!items.length) return;

    // En móvil el track es vertical (alto), en desktop horizontal (ancho).
    function isVertical() { return window.matchMedia('(max-width: 767px)').matches; }

    function setFill(p) {
      if (!fill) return;
      var pct = (Math.max(0, Math.min(1, p)) * 100).toFixed(2) + '%';
      if (isVertical()) { fill.style.height = pct; fill.style.width = '100%'; }
      else              { fill.style.width = pct;  fill.style.height = '100%'; }
    }

    // Umbral = centro de cada hito a lo largo del recorrido.
    var thresholds = [];
    items.forEach(function (_, i) { thresholds.push((i + 0.5) / items.length); });

    function activate(p) {
      items.forEach(function (item, i) {
        item.classList.toggle('is-active', p >= thresholds[i] - 0.05);
      });
    }

    // Fallback sin GSAP o con movimiento reducido: todo lleno y activo.
    if (!hasGsap || reduced) { setFill(1); activate(1); return; }

    ScrollTrigger.create({
      trigger: tl,
      start: 'top 78%',
      end: 'center 58%',
      onUpdate: function (self) { setFill(self.progress); activate(self.progress); },
      onEnter:  function () { items[0].classList.add('is-active'); }
    });
  });

  /* ── Cabecera de página: entrada escalonada del texto y la ilustración ── */
  var hero = document.querySelector('.zia-page-hero');
  if (hero && hasGsap && !reduced) {
    var parts = hero.querySelectorAll('.zia-page-hero__eyebrow, .zia-page-hero__lead, .zia-page-hero__crumbs, [data-zia-hero-item]');
    gsap.from(parts, { y: 24, opacity: 0, duration: .7, stagger: .12, ease: 'power3.out', delay: .2 });
    var art = hero.querySelector('.zia-page-hero__art');
    if (art) gsap.from(art, { x: 40, opacity: 0, duration: 1, ease: 'power3.out', delay: .35 });
  }
}());
