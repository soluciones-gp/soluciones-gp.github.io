(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Video de bienvenida (loop) ---
  var video = document.querySelector('[data-hero-video]');
  var btn = document.querySelector('[data-hero-toggle]');
  var btnText = document.querySelector('[data-hero-toggle-text]');
  var ctrl = document.querySelector('[data-hero-ctrl]');
  var snd = document.querySelector('[data-hero-sound]');
  var sndText = document.querySelector('[data-hero-sound-text]');
  if (video) {
    var conn = navigator.connection || {};
    var small = window.matchMedia('(max-width: 800px)').matches;
    var skip = reduced || conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
    if (!skip) {
      video.src = small ? video.getAttribute('data-src-sd') : video.getAttribute('data-src-hd');
      video.muted = true; video.defaultMuted = true;
      video.addEventListener('playing', function () { video.classList.add('is-ready'); if (ctrl) ctrl.hidden = false; }, { once: true });
      var p = video.play(); if (p && p.catch) p.catch(function () { /* sin autoplay: se queda el póster */ });
      if (snd) snd.addEventListener('click', function () {
        var on = video.muted; // estaba en silencio: se activa el sonido
        video.muted = !on; video.defaultMuted = !on;
        if (on) video.volume = 1;
        snd.setAttribute('aria-pressed', on ? 'true' : 'false');
        snd.setAttribute('aria-label', on ? 'Silenciar el video de bienvenida' : 'Activar sonido del video de bienvenida');
        sndText.textContent = on ? 'Silenciar' : 'Activar sonido';
      });
      if (btn) btn.addEventListener('click', function () {
        var paused = btn.getAttribute('aria-pressed') === 'true';
        if (paused) { video.play(); btn.setAttribute('aria-pressed', 'false'); btnText.textContent = 'Pausar video'; }
        else { video.pause(); btn.setAttribute('aria-pressed', 'true'); btnText.textContent = 'Reproducir video'; }
      });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) video.pause(); else if (btn && btn.getAttribute('aria-pressed') !== 'true') video.play().catch(function () {});
      });
    }
  }

  // --- Aparición y contadores animados ---
  var reveals = document.querySelectorAll('[data-reveal]');
  var counters = document.querySelectorAll('[data-count-to]');
  var render = function (el, n) { el.textContent = n + (el.getAttribute('data-suffix') || ''); };
  var runCounter = function (el) {
    var target = parseFloat(el.getAttribute('data-count-to')) || 0;
    if (reduced) { render(el, target); return; }
    var start = performance.now(), dur = 1600;
    var tick = function (now) {
      var t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 3);
      render(el, Math.round(target * e));
      if (t < 1) requestAnimationFrame(tick); else render(el, target);
    };
    requestAnimationFrame(tick);
  };
  if (!('IntersectionObserver' in window)) {
    document.documentElement.classList.add('no-io');
    reveals.forEach(function (el) { el.classList.add('is-in'); });
    counters.forEach(function (el) { runCounter(el); });
  } else {
    counters.forEach(function (el) { if (!reduced) render(el, 0); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        en.target.querySelectorAll('[data-count-to]').forEach(runCounter);
        io.unobserve(en.target);
      });
    }, { threshold: 0.25 });
    reveals.forEach(function (el) { io.observe(el); });
  }
})();

/* Video del centro de transferencia: si DAISY ya dejó el archivo, reemplaza el marcador. */
(function () {
  var box = document.querySelector('[data-transfer-video]');
  if (!box || !window.fetch) return;
  var hd = box.getAttribute('data-src-hd'), sd = box.getAttribute('data-src-sd'), poster = box.getAttribute('data-poster');
  var exists = function (u) {
    return fetch(u, { method: 'HEAD' }).then(function (r) { return r.ok && /^video\//.test(r.headers.get('content-type') || ''); }).catch(function () { return false; });
  };
  var small = window.matchMedia('(max-width: 760px)').matches || (navigator.connection && navigator.connection.saveData);
  Promise.all([exists(hd), exists(sd)]).then(function (r) {
    var src = small && r[1] ? sd : (r[0] ? hd : (r[1] ? sd : null));
    if (!src) return; // sin video: se queda el marcador
    var v = document.createElement('video');
    v.controls = true; v.setAttribute('playsinline', ''); v.preload = 'metadata'; v.poster = poster;
    v.setAttribute('aria-label', 'Video: así funciona nuestro centro de transferencia');
    v.src = src;
    box.textContent = ''; box.appendChild(v);
  });
})();
