/* Página de soporte remoto (ziacentro.mx/soporte).
 *
 * 1. Inventa el Código ZIA del cliente (9 cifras al azar) y lo guarda en este navegador SIN
 *    caducidad: quien instaló el acceso permanente desde aquí vuelve y ve el mismo código que
 *    lleva su programa. (Otro navegador u otra computadora dan otro código: lo avisa la página.)
 * 2. Cada descarga va a la consola (api.ziacentro.mx/api/soporte/descargar), que redirige a
 *    MeshCentral con el grupo y el código ya puestos: el instalador lleva el código dentro
 *    (el «tag» del agente) y así el técnico encuentra el equipo con el número que ve el cliente.
 * 3. Detecta el sistema para el botón principal; «Otras versiones» deja elegir a mano.
 */
(function () {
  'use strict';

  var API = 'https://api.ziacentro.mx/api/soporte';
  var CLAVE = 'zia-soporte-codigo';

  function nuevoCodigo() {
    var n;
    if (window.crypto && window.crypto.getRandomValues) {
      var a = new Uint32Array(1);
      window.crypto.getRandomValues(a);
      n = a[0] % 1000000000;
    } else {
      n = Math.floor(Math.random() * 1000000000);
    }
    return ('000000000' + n).slice(-9);
  }

  function codigo() {
    try {
      var guardado = JSON.parse(localStorage.getItem(CLAVE) || 'null');
      // Los guardados antes con caducidad ({codigo, hasta}) se respetan igual.
      if (guardado && /^\d{9}$/.test(guardado.codigo)) return guardado.codigo;
    } catch (e) { /* Sin almacenamiento (modo privado): un código por visita. */ }
    var c = nuevoCodigo();
    try { localStorage.setItem(CLAVE, JSON.stringify({ codigo: c, desde: Date.now() })); } catch (e) { }
    return c;
  }

  function formatear(c) { return c.slice(0, 3) + ' ' + c.slice(3, 6) + ' ' + c.slice(6); }

  function enlace(tipo, sistema, c) {
    return API + '/descargar?tipo=' + encodeURIComponent(tipo) + '&sistema=' + encodeURIComponent(sistema) + '&codigo=' + c;
  }

  // windows | windows-arm | macos | linux | movil
  function sistemaDetectado() {
    var ua = navigator.userAgent || '';
    var plataforma = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    if (/Android|iPhone|iPad|iPod/i.test(ua) || (/Mac/i.test(plataforma) && navigator.maxTouchPoints > 1)) return 'movil';
    if (/Win/i.test(plataforma) || /Windows/i.test(ua)) return /ARM/i.test(ua) ? 'windows-arm' : 'windows';
    if (/Mac/i.test(plataforma) || /Macintosh/i.test(ua)) return 'macos';
    if (/Linux|X11|CrOS/i.test(plataforma + ua)) return 'linux';
    return 'windows';
  }

  function copiar(texto, boton, listo) {
    var original = boton.textContent;
    var hecho = function () { boton.textContent = listo; setTimeout(function () { boton.textContent = original; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(hecho, function () { window.prompt('Copia esto:', texto); });
    } else {
      window.prompt('Copia esto:', texto);
    }
  }

  var c = codigo();
  var sistema = sistemaDetectado();
  document.getElementById('zs-codigo').textContent = formatear(c);
  document.getElementById('zs-copiar').addEventListener('click', function () { copiar(formatear(c), this, 'Copiado'); });

  // Enlaces con el código del cliente.
  var elementos = document.querySelectorAll('a[data-tipo]');
  for (var i = 0; i < elementos.length; i++) {
    var a = elementos[i];
    var s = a.getAttribute('data-sistema');
    if (!s) s = (sistema === 'windows-arm') ? 'windows-arm' : (sistema === 'macos' ? 'macos' : 'windows');
    a.href = enlace(a.getAttribute('data-tipo'), s, c);
  }

  var rapido = document.getElementById('zs-rapido');
  var permanente = document.getElementById('zs-permanente');
  var linux = document.getElementById('zs-linux');
  var mostrarLinux = function (e) {
    if (e) e.preventDefault();
    linux.hidden = false;
    permanente.hidden = true;
  };
  document.getElementById('zs-ver-linux').addEventListener('click', mostrarLinux);
  document.getElementById('zs-copiar-linux').addEventListener('click', function () {
    copiar(document.getElementById('zs-linux-comando').textContent, this, 'Copiado');
  });

  if (sistema === 'macos' || sistema === 'linux') {
    // El soporte rápido (MeshCentral Assistant) solo existe para Windows.
    rapido.classList.add('is-desactivado');
    rapido.removeAttribute('href');
    rapido.setAttribute('aria-disabled', 'true');
    document.getElementById('zs-rapido-nota').textContent = 'Solo para Windows. En tu computadora usa el acceso permanente.';
  }
  if (sistema === 'macos') document.getElementById('zs-permanente-texto').textContent = 'Descargar para macOS';
  if (sistema === 'linux') mostrarLinux();

  if (sistema === 'movil') {
    document.getElementById('zs-movil').hidden = false;
    document.getElementById('zs-compartir').addEventListener('click', function () {
      var url = 'https://ziacentro.mx/soporte/';
      if (navigator.share) {
        navigator.share({ title: 'Soporte remoto de ZIA', url: url }).catch(function () { });
      } else {
        copiar(url, this, 'Enlace copiado');
      }
    });
  }
})();
