(function () {
  var toggle  = document.getElementById('nav-toggle');
  var menu    = document.getElementById('nav-menu');
  var overlay = document.getElementById('nav-overlay');

  if (!toggle || !menu || !overlay) return;

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
}());
