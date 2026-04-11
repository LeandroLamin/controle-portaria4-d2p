// js/session-timeout.js — Timeout de sessão por inatividade
(function () {
  var TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos para expirar
  var AVISO_MS   = 14 * 60 * 1000; // aviso 1 minuto antes

  var timerExpiry, timerAviso, countdownInterval;
  var overlay;

  function logout() {
    sessionStorage.clear();
    location.replace('/menu/index.html');
  }

  function criarOverlay() {
    overlay = document.createElement('div');
    overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.6);align-items:center;justify-content:center';
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:12px;padding:36px 32px;max-width:360px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.35)">' +
        '<div style="font-size:42px;margin-bottom:12px">&#9201;</div>' +
        '<div style="font-size:18px;font-weight:800;color:#c0392b;margin-bottom:8px">Sessão expirando</div>' +
        '<div style="font-size:14px;color:#555;margin-bottom:20px;line-height:1.5">' +
          'Inatividade detectada. A sessão será encerrada em <b id="d2p-countdown">60</b> segundos.' +
        '</div>' +
        '<button onclick="window.__d2pContinuar()" style="background:#1a8a7a;color:#fff;border:none;border-radius:6px;padding:12px 32px;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:1px">CONTINUAR SESSÃO</button>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  function mostrarAviso() {
    if (!overlay) criarOverlay();
    overlay.style.display = 'flex';
    var segundos = 60;
    document.getElementById('d2p-countdown').textContent = segundos;
    countdownInterval = setInterval(function () {
      segundos--;
      var el = document.getElementById('d2p-countdown');
      if (el) el.textContent = segundos;
      if (segundos <= 0) clearInterval(countdownInterval);
    }, 1000);
  }

  function esconderAviso() {
    clearInterval(countdownInterval);
    if (overlay) overlay.style.display = 'none';
  }

  window.__d2pContinuar = function () { resetar(); };

  function resetar() {
    clearTimeout(timerExpiry);
    clearTimeout(timerAviso);
    esconderAviso();
    timerAviso  = setTimeout(mostrarAviso, AVISO_MS);
    timerExpiry = setTimeout(logout, TIMEOUT_MS);
  }

  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(function (ev) {
    document.addEventListener(ev, resetar, { passive: true });
  });

  resetar();
})();
