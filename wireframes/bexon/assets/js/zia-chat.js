/* Asistente de chat de la landing. Habla con el servicio zia-chatbot en /api/chat/ (mismo
   dominio, nginx). Sin dependencias. Reglas:
   - Nada del servidor se inserta como HTML: todo va con textContent; solo se convierten en
     enlace las URL de WhatsApp/teléfono/aviso de privacidad, creadas con createElement.
   - Si /api/chat/config falla o el bot está apagado, no aparece el botón.
   - Los datos de contacto solo se piden en el formulario, tras aceptar el aviso de privacidad. */
(function () {
  'use strict';
  if (window.__ziaChat) return;
  window.__ziaChat = true;

  var API = '/api/chat';
  var K_SESION = 'zia-chat-sesion';
  var K_LOG = 'zia-chat-log';
  var K_INVITADO = 'zia-chat-invitado';
  var K_VISITANTE = 'zia-chat-visitante';
  var cfg = null, sesion = null, ocupado = false;
  var fab, panel, log, entrada, enviar, invite;

  function el(tag, cls, texto) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (texto != null) n.textContent = texto;
    return n;
  }
  function leer(store, k) { try { return JSON.parse(store.getItem(k)); } catch (e) { return null; } }
  function guardar(store, k, v) { try { store.setItem(k, JSON.stringify(v)); } catch (e) { /* modo privado */ } }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, function () { return (Math.random() * 16 | 0).toString(16); });
  }
  function svg(path) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', path); s.appendChild(p);
    return s;
  }

  /* Texto con enlaces seguros: solo wa.me, tel: y el aviso de privacidad. */
  var URL_RE = /(https:\/\/wa\.me\/\d{10,15}(?:\?text=[^\s]*)?|\/aviso-privacidad\.html)/g;
  function pintar(nodo, texto) {
    nodo.textContent = '';
    var partes = String(texto).split(URL_RE);
    for (var i = 0; i < partes.length; i++) {
      var t = partes[i];
      if (!t) continue;
      if (i % 2 === 1) {
        var a = el('a', null, t.indexOf('wa.me') >= 0 ? 'WhatsApp' : 'aviso de privacidad');
        a.href = t.replace(/[.,;)]+$/, '');
        a.target = '_blank'; a.rel = 'noopener';
        if (t.indexOf('wa.me') >= 0) a.addEventListener('click', function () { handoff('whatsapp'); });
        nodo.appendChild(a);
      } else {
        nodo.appendChild(document.createTextNode(t));
      }
    }
  }

  function burbuja(rol, texto, recordar) {
    var b = el('div', 'zchat-msg zchat-msg--' + rol);
    if (texto) pintar(b, texto);
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    if (recordar !== false && texto && (rol === 'bot' || rol === 'user')) {
      var h = leer(sessionStorage, K_LOG) || [];
      h.push([rol, texto]);
      guardar(sessionStorage, K_LOG, h.slice(-40));
    }
    return b;
  }
  function recordarBot(texto) {
    var h = leer(sessionStorage, K_LOG) || [];
    h.push(['bot', texto]);
    guardar(sessionStorage, K_LOG, h.slice(-40));
  }

  function bloquear(si) {
    ocupado = si;
    enviar.disabled = si;
    entrada.disabled = si;
    if (!si) entrada.focus();
  }

  function api(ruta, cuerpo) {
    return fetch(API + ruta, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo), credentials: 'omit', keepalive: ruta === '/handoff'
    });
  }

  function asegurarSesion() {
    if (sesion && sesion.exp > Date.now()) return Promise.resolve(sesion);
    var visitante = leer(localStorage, K_VISITANTE);
    if (!visitante) { visitante = uuid(); guardar(localStorage, K_VISITANTE, visitante); }
    return api('/session', { visitanteId: visitante }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error(j && j.error || 'No disponible');
        sesion = { id: j.conversationId, token: j.token, exp: Date.now() + 23 * 3600 * 1000 };
        guardar(sessionStorage, K_SESION, sesion);
        return sesion;
      });
    });
  }

  function handoff(canal) {
    if (!sesion) return;
    api('/handoff', { conversationId: sesion.id, token: sesion.token, canal: canal }).catch(function () {});
  }

  /* Envía texto o una elección; lee la respuesta SSE y la va pintando. */
  function mandar(texto, eleccion, etiqueta, reintento) {
    if (ocupado) return;
    if (!reintento) burbuja('user', etiqueta || texto);
    bloquear(true);
    var bot = burbuja('bot', '', false);
    bot.classList.add('zchat-msg--typing');
    var acumulado = '';

    asegurarSesion().then(function (s) {
      return api('/message', { conversationId: s.id, token: s.token, text: texto || null, choice: eleccion || null });
    }).then(function (r) {
      if ((r.status === 401 || r.status === 404) && !reintento) {
        sesion = null; sessionStorage.removeItem(K_SESION);
        bot.remove(); ocupado = false;
        return mandar(texto, eleccion, etiqueta, true);
      }
      if (!r.ok || !r.body) {
        return r.json().catch(function () { return {}; }).then(function (j) { throw new Error(j.error || 'Error ' + r.status); });
      }
      var lector = r.body.getReader(), dec = new TextDecoder(), bufer = '';
      function paso() {
        return lector.read().then(function (x) {
          if (x.done) return;
          bufer += dec.decode(x.value, { stream: true });
          var i;
          while ((i = bufer.indexOf('\n\n')) >= 0) {
            var bloque = bufer.slice(0, i); bufer = bufer.slice(i + 2);
            var ev = 'message', datos = '';
            bloque.split('\n').forEach(function (l) {
              if (l.indexOf('event: ') === 0) ev = l.slice(7);
              else if (l.indexOf('data: ') === 0) datos += l.slice(6);
            });
            var d = {}; try { d = JSON.parse(datos || '{}'); } catch (e) { /* ignora */ }
            if (ev === 'token') {
              bot.classList.remove('zchat-msg--typing');
              acumulado += d.t || ''; bot.textContent = acumulado; log.scrollTop = log.scrollHeight;
            } else if (ev === 'replace') {
              acumulado = d.text || ''; bot.textContent = acumulado;
            } else if (ev === 'action') {
              accion(d);
            } else if (ev === 'error') {
              bot.classList.remove('zchat-msg--typing');
              acumulado = d.message || 'Ocurrió un error.'; bot.textContent = acumulado;
            }
          }
          return paso();
        });
      }
      return paso().then(function () {
        bot.classList.remove('zchat-msg--typing');
        if (!acumulado) { bot.remove(); } else { pintar(bot, acumulado); recordarBot(acumulado); }
        // Las acciones se pintaron después de la burbuja del bot: van al final del registro.
      });
    }).catch(function (e) {
      bot.remove();
      var err = burbuja('error', (e && e.message ? e.message + '. ' : '') + 'Si es urgente, llámenos al ' + cfg.telefono + ' o escríbanos por WhatsApp: ' + cfg.whatsappUrl, false);
      err.className = 'zchat-msg zchat-msg--error';
    }).then(function () { if (ocupado) bloquear(false); });
  }

  function caja() { var c = el('div', 'zchat-actions'); log.appendChild(c); log.scrollTop = log.scrollHeight; return c; }
  function chip(texto, cls, fn) {
    var b = el('button', 'zchat-chip' + (cls ? ' ' + cls : ''), texto);
    b.type = 'button'; b.addEventListener('click', fn); return b;
  }
  function desactivar(c) { Array.prototype.forEach.call(c.querySelectorAll('button'), function (b) { b.disabled = true; }); }

  function accion(a) {
    var c;
    if (a.type === 'handoff') {
      c = caja();
      var tel = el('a', 'zchat-chip' + (a.urgent ? ' zchat-chip--urgent' : ' zchat-chip--solid'), 'Llamar al ' + a.telefono);
      tel.href = /^tel:\+?\d{10,15}$/.test(a.tel) ? a.tel : 'tel:+526641594369';
      tel.addEventListener('click', function () { handoff('telefono'); });
      var wa = el('a', 'zchat-chip zchat-chip--wa', 'WhatsApp');
      wa.href = /^https:\/\/wa\.me\/\d{10,15}(\?text=[^\s]*)?$/.test(a.whatsappUrl) ? a.whatsappUrl : 'https://wa.me/526641594369';
      wa.target = '_blank'; wa.rel = 'noopener';
      wa.addEventListener('click', function () { handoff('whatsapp'); });
      c.appendChild(tel); c.appendChild(wa);
    } else if (a.type === 'choices') {
      c = caja();
      var elegidos = [];
      (a.options || []).forEach(function (o) {
        var b = chip(o.label, '', function () {
          if (!a.multiple) { desactivar(c); mandar(null, a.kind + ':' + o.value, o.label); return; }
          var k = elegidos.indexOf(o.value);
          if (k >= 0) elegidos.splice(k, 1); else elegidos.push(o.value);
          b.setAttribute('aria-pressed', k >= 0 ? 'false' : 'true');
          seguir.disabled = elegidos.length === 0;
        });
        if (a.multiple) b.setAttribute('aria-pressed', 'false');
        c.appendChild(b);
      });
      if (a.multiple) {
        var seguir = chip('Continuar', 'zchat-chip--solid', function () {
          var etiquetas = (a.options || []).filter(function (o) { return elegidos.indexOf(o.value) >= 0; }).map(function (o) { return o.label; });
          desactivar(c); mandar(null, a.kind + ':' + elegidos.join(','), etiquetas.join(', '));
        });
        seguir.disabled = true;
        c.appendChild(seguir);
      }
    } else if (a.type === 'suggest') {
      c = caja();
      (a.options || []).forEach(function (o) {
        c.appendChild(chip(o.label, '', function () { desactivar(c); mandar(null, o.choice, o.label); }));
      });
    } else if (a.type === 'quick') {
      c = caja();
      (a.options || []).forEach(function (t) {
        c.appendChild(chip(t, '', function () { desactivar(c); mandar(t); }));
      });
    } else if (a.type === 'consent') {
      c = caja();
      var aviso = el('a', 'zchat-chip', 'Leer aviso de privacidad');
      aviso.href = cfg.avisoUrl; aviso.target = '_blank'; aviso.rel = 'noopener';
      c.appendChild(chip('Acepto', 'zchat-chip--solid', function () { desactivar(c); mandar(null, 'consentimiento:si', 'Acepto'); }));
      c.appendChild(chip('No, gracias', '', function () { desactivar(c); mandar(null, 'consentimiento:no', 'No, gracias'); }));
      c.appendChild(aviso);
    } else if (a.type === 'lead_form') {
      formulario(a);
    }
  }

  function campo(f, etiqueta, nombre, tipo, extra) {
    var l = el('label', null, etiqueta);
    var i = tipo === 'textarea' ? el('textarea') : tipo === 'select' ? el('select') : el('input');
    if (tipo !== 'textarea' && tipo !== 'select') i.type = tipo;
    i.name = nombre;
    if (extra) Object.keys(extra).forEach(function (k) { i.setAttribute(k, extra[k]); });
    l.appendChild(i);
    var err = el('span', 'zchat-form__err'); l.appendChild(err);
    f.appendChild(l);
    return i;
  }

  function formulario(a) {
    var f = el('form', 'zchat-form');
    f.noValidate = true;
    var nombre = campo(f, 'Nombre *', 'nombre', 'text', { maxlength: '128', autocomplete: 'name', required: '' });
    var empresa = campo(f, 'Gasolinera o empresa', 'empresa', 'text', { maxlength: '128', autocomplete: 'organization' });
    var telefono = campo(f, 'Teléfono (10 dígitos) *', 'telefono', 'tel', { maxlength: '20', autocomplete: 'tel', inputmode: 'tel', required: '' });
    var correo = campo(f, 'Correo', 'correo', 'email', { maxlength: '256', autocomplete: 'email' });
    var estado = campo(f, 'Estado de la estación *', 'estado', 'select', { required: '' });
    var op0 = el('option', null, 'Elija…'); op0.value = ''; estado.appendChild(op0);
    (cfg.estados || []).forEach(function (e) { var o = el('option', null, e); o.value = e; estado.appendChild(o); });
    var detalles = campo(f, 'Detalles (opcional)', 'detalles', 'textarea', { maxlength: '2000' });

    var lc = el('label', 'zchat-consent');
    var chk = el('input'); chk.type = 'checkbox'; chk.name = 'consentimiento';
    lc.appendChild(chk);
    var tx = el('span', null, 'He leído y acepto el ');
    var av = el('a', null, 'aviso de privacidad'); av.href = a.url || cfg.avisoUrl; av.target = '_blank'; av.rel = 'noopener';
    tx.appendChild(av); tx.appendChild(document.createTextNode('.'));
    lc.appendChild(tx);
    var errC = el('span', 'zchat-form__err'); lc.appendChild(errC);
    f.appendChild(lc);

    var boton = el('button', 'zchat-chip zchat-chip--solid', 'Enviar solicitud'); boton.type = 'submit';
    f.appendChild(boton);
    log.appendChild(f); log.scrollTop = log.scrollHeight;
    nombre.focus();

    function marcar(input, msg) {
      var l = input.closest('label');
      if (l) { l.classList.toggle('is-invalid', !!msg); var s = l.querySelector('.zchat-form__err'); if (s) s.textContent = msg || ''; }
    }

    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var tel = telefono.value.replace(/\D/g, '').replace(/^521?(\d{10})$/, '$1');
      var errores = 0;
      marcar(nombre, nombre.value.trim().length < 2 ? (errores++, 'Escriba su nombre.') : '');
      marcar(telefono, tel.length !== 10 ? (errores++, 'Deben ser 10 dígitos.') : '');
      marcar(correo, correo.value && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(correo.value.trim()) ? (errores++, 'Correo no válido.') : '');
      marcar(estado, !estado.value ? (errores++, 'Elija un estado.') : '');
      errC.textContent = chk.checked ? '' : (errores++, 'Debe aceptar el aviso de privacidad.');
      if (errores) return;
      boton.disabled = true; boton.textContent = 'Enviando…';
      api('/lead', {
        conversationId: sesion.id, token: sesion.token,
        nombre: nombre.value.trim(), empresa: empresa.value.trim() || null, telefono: tel,
        correo: correo.value.trim() || null, estado: estado.value, detalles: detalles.value.trim() || null,
        temas: a.temas ? String(a.temas).split(',') : [], urgencia: a.urgencia || null,
        consentimiento: true, versionAviso: a.version || cfg.versionAviso
      }).then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) {
            if (j.campos) {
              Object.keys(j.campos).forEach(function (k) {
                if (k === 'consentimiento') errC.textContent = j.campos[k];
                else if (f.elements[k]) marcar(f.elements[k], j.campos[k]);
              });
            }
            throw new Error(j.error || 'No se pudo enviar');
          }
          f.remove();
          burbuja('bot', j.mensaje);
          var c = caja();
          var wa = el('a', 'zchat-chip zchat-chip--wa', 'Escribirnos por WhatsApp');
          wa.href = /^https:\/\/wa\.me\/\d{10,15}(\?text=[^\s]*)?$/.test(j.whatsappUrl) ? j.whatsappUrl : cfg.whatsappUrl;
          wa.target = '_blank'; wa.rel = 'noopener';
          wa.addEventListener('click', function () { handoff('whatsapp'); });
          c.appendChild(wa);
        });
      }).catch(function (e) {
        boton.disabled = false; boton.textContent = 'Enviar solicitud';
        errC.textContent = e.message || 'No se pudo enviar.';
      });
    });
  }

  function abrir() {
    if (invite) { invite.remove(); invite = null; }
    guardar(localStorage, K_INVITADO, 1);
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    if (!log.childNodes.length) {
      var h = leer(sessionStorage, K_LOG);
      if (h && h.length) h.forEach(function (m) { burbuja(m[0], m[1], false); });
      else {
        burbuja('bot', cfg.bienvenida);
        accion({ type: 'quick', options: ['¿Qué revisa la ASEA?', '¿Qué es el control volumétrico?', 'Tengo una clausura', 'Quiero un diagnóstico'] });
      }
    }
    setTimeout(function () { entrada.focus(); }, 50);
  }
  function cerrar() {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    fab.focus();
  }

  function construir() {
    fab = el('button', 'zchat-fab');
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Abrir el asistente de ZIA');
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'zchat-panel');
    fab.title = 'Asistente: dudas sobre ASEA, CNE, SAT…';
    fab.appendChild(svg('M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z'));
    fab.addEventListener('click', function () { panel.hidden ? abrir() : cerrar(); });

    panel = el('section', 'zchat-panel');
    panel.id = 'zchat-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'zchat-titulo');

    var head = el('header', 'zchat-head');
    head.appendChild(el('span', 'zchat-head__dot'));
    var titulo = el('h2', 'zchat-head__title', 'Asistente ZIA');
    titulo.id = 'zchat-titulo';
    titulo.appendChild(el('small', null, 'ASEA · CNE · SAT · STPS · Protección Civil'));
    head.appendChild(titulo);
    var x = el('button', 'zchat-head__close', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar el asistente');
    x.addEventListener('click', cerrar);
    head.appendChild(x);

    log = el('div', 'zchat-log');
    log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite');

    var form = el('form', 'zchat-compose');
    entrada = el('textarea');
    entrada.rows = 1;
    entrada.maxLength = cfg.maxCaracteres || 1000;
    entrada.placeholder = 'Escriba su pregunta…';
    entrada.setAttribute('aria-label', 'Su mensaje');
    enviar = el('button', 'zchat-send'); enviar.type = 'submit'; enviar.setAttribute('aria-label', 'Enviar');
    enviar.appendChild(svg('M3 20.5v-6l8-2.5-8-2.5v-6L22 12z'));
    form.appendChild(entrada); form.appendChild(enviar);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var t = entrada.value.trim();
      if (!t || ocupado) return;
      entrada.value = ''; entrada.style.height = '';
      mandar(t);
    });
    entrada.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit')); }
    });
    entrada.addEventListener('input', function () { entrada.style.height = ''; entrada.style.height = Math.min(entrada.scrollHeight, 110) + 'px'; });

    var foot = el('div', 'zchat-foot', 'Asistente automático; puede equivocarse. ');
    var av = el('a', null, 'Aviso de privacidad'); av.href = cfg.avisoUrl; av.target = '_blank'; av.rel = 'noopener';
    foot.appendChild(av);

    panel.appendChild(head); panel.appendChild(log); panel.appendChild(form); panel.appendChild(foot);
    document.body.appendChild(fab);
    document.body.appendChild(panel);

    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !panel.hidden) cerrar(); });

    // Invitación: una sola vez por navegador, a los 8 s, si no abrió el chat.
    if (!leer(localStorage, K_INVITADO) && cfg.invitacion) {
      setTimeout(function () {
        if (!panel.hidden || leer(localStorage, K_INVITADO)) return;
        guardar(localStorage, K_INVITADO, 1);
        invite = el('div', 'zchat-invite', cfg.invitacion);
        invite.setAttribute('role', 'status');
        var cx = el('button', 'zchat-invite__close', '×'); cx.type = 'button'; cx.setAttribute('aria-label', 'Cerrar invitación');
        cx.addEventListener('click', function (ev) { ev.stopPropagation(); invite.remove(); invite = null; });
        invite.appendChild(cx);
        invite.addEventListener('click', abrir);
        document.body.appendChild(invite);
      }, 8000);
    }
  }

  function iniciar() {
    if (!window.fetch || !window.TextDecoder || !window.ReadableStream) return;
    sesion = leer(sessionStorage, K_SESION);
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 6000);
    fetch(API + '/config', { credentials: 'omit', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (c) {
        clearTimeout(t);
        if (!c || !c.habilitado) return;
        cfg = c;
        construir();
      })
      .catch(function () { /* sin asistente: queda el WhatsApp */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
