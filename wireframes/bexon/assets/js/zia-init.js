/* Arranque mínimo de la landing (sustituye a main.js del template, del que solo se usaban
   ScrollSmoother en escritorio y VenoBox para el video). */
(function () {
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.config({ nullTargetWarn: false });
    if (window.ScrollSmoother && document.getElementById('smooth-wrapper') && document.getElementById('smooth-content')) {
      gsap.registerPlugin(ScrollSmoother);
      // En pantallas táctiles se usa el scroll nativo (smoothTouch: false)
      ScrollSmoother.create({ smooth: 1.5, effects: true, smoothTouch: false, ignoreMobileResize: true });
    }
  }
  if (window.VenoBox && document.querySelector('.video-popup')) {
    new VenoBox({ selector: '.video-popup', numeration: true, spinner: 'pulse' });
  }
}());
