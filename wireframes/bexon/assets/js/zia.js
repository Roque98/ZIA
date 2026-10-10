/* ═══════════════════════════════════════════════════
   ZIA — Comportamiento compartido (Propuesta 02)
   Cargar después de main.js. Cada módulo es opcional:
   si su marcado no existe en la página, no hace nada.
═══════════════════════════════════════════════════ */
(function () {
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  // appear.min.js (template) recorre sus checks mientras se eliminan a sí mismos: si varios
  // elementos aparecen a la vez el índice queda fuera de rango. Recorrer una copia lo evita.
  if (window.jQuery && jQuery.fn.appear) {
    jQuery.fn.appear.checkAll = function () {
      var checks = jQuery.fn.appear.checks.slice();
      for (var i = checks.length; i--;) if (typeof checks[i] === 'function') checks[i]();
    };
  }

  // Las fuentes y el SplitText del template cambian alturas después de crear los triggers:
  // recalcular posiciones cuando todo terminó de cargar.
  if (hasGsap) {
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

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
    // fromTo con valores finales explícitos: el template pone transition:all en <p> y un
    // gsap.from leería un valor intermedio como destino.
    gsap.fromTo(parts, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .12, ease: 'power3.out', delay: .2, clearProps: 'transform,opacity' });
    var art = hero.querySelector('.zia-page-hero__art');
    if (art) gsap.fromTo(art, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: .35, clearProps: 'transform,opacity' });
  }
  /* ── Mapa de oficinas: pin ↔ tarjeta sincronizados ── */
  document.querySelectorAll('[data-zia-map]').forEach(function (map) {
    var pins  = map.querySelectorAll('[data-office]');
    var cards = document.querySelectorAll('[data-office-card]');

    function setActive(id) {
      pins.forEach(function (p) { p.classList.toggle('is-active', p.dataset.office === id); });
      cards.forEach(function (c) { c.classList.toggle('is-active', c.dataset.officeCard === id); });
    }

    pins.forEach(function (pin) {
      var id = pin.dataset.office;
      pin.addEventListener('mouseenter', function () { setActive(id); });
      pin.addEventListener('focus', function () { setActive(id); });
      pin.addEventListener('click', function () {
        setActive(id);
        // En pantallas angostas la lista queda debajo del mapa: llevar a la tarjeta.
        var card = document.querySelector('[data-office-card="' + id + '"]');
        if (card && window.matchMedia('(max-width: 991px)').matches) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      pin.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin.dispatchEvent(new Event('click')); }
      });
    });
    cards.forEach(function (card) {
      var id = card.dataset.officeCard;
      ['mouseenter', 'focus', 'click'].forEach(function (ev) {
        card.addEventListener(ev, function () { setActive(id); });
      });
    });

    var fromHash = location.hash.indexOf('#oficina-') === 0 ? location.hash.slice(9) : null;
    setActive(fromHash || (cards[0] && cards[0].dataset.officeCard));

    if (hasGsap && !reduced) {
      var st = { trigger: map, start: 'top 80%' };
      gsap.fromTo(map.querySelector('.zia-map__dots'), { opacity: 0 }, { opacity: .45, duration: 1.2, ease: 'power1.out', scrollTrigger: st, clearProps: 'opacity' });
      gsap.fromTo(pins, { opacity: 0 }, { opacity: 1, duration: .6, stagger: .14, ease: 'power2.out', delay: .4, scrollTrigger: st });
    }
  });

  /* ── Ancla en la URL (p.ej. contacto.html#oficina-morelia): ScrollSmoother no la respeta sola ── */
  if (location.hash.length > 1) {
    window.addEventListener('load', function () {
      var target = document.querySelector(location.hash);
      if (!target) return;
      var smoother = window.ScrollSmoother && ScrollSmoother.get && ScrollSmoother.get();
      if (smoother) smoother.scrollTo(target, true, 'top 120px');
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  }
}());
