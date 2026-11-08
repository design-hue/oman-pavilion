/* Shared "Main menu" button for the Oman Pavilion kiosk.
   Shown only when a screen is opened from the main menu (index.html at the site root);
   the standalone links keep working exactly as before.
   A page tells it where to sit and when to show:
     window.KIOSK_MENU = { pos: {left|right: px, top|bottom: px}  (1920x1080 stage units),
                           show: () => true/false }                 (optional, default always) */
(function () {
  var hub = null;
  try { if (window.parent !== window && window.parent.KIOSK_HUB) hub = window.parent.KIOSK_HUB; } catch (e) {}
  window.KIOSK = {
    embedded: !!hub,
    toMenu: function () { if (hub) hub.close(); else location.href = new URL("../index.html", location.href).href; }
  };
  if (!hub) return;

  var css = document.createElement("style");
  css.textContent =
    ".kiosk-menu{--ku:min(calc(100vw / 1920), calc(100vh / 1080));position:fixed;z-index:2147483000;display:flex;align-items:center;" +
    "gap:calc(12*var(--ku));height:calc(72*var(--ku));padding:0 calc(30*var(--ku)) 0 calc(22*var(--ku));border-radius:99px;border:1px solid rgba(255,226,179,.35);" +
    "background:rgba(42,8,41,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#ffe2b3;font:600 calc(24*var(--ku))/1 'IBM Plex Sans Arabic','Segoe UI',system-ui,sans-serif;" +
    "box-shadow:0 calc(14*var(--ku)) calc(30*var(--ku)) rgba(10,0,10,.35);cursor:pointer;transition:transform .2s,opacity .3s;-webkit-tap-highlight-color:transparent}" +
    ".kiosk-menu:active{transform:scale(.95)}.kiosk-menu svg{width:calc(30*var(--ku));height:calc(30*var(--ku))}.kiosk-menu[hidden]{display:none}";
  document.head.appendChild(css);

  function mount() {
    var cfg = window.KIOSK_MENU || {}, pos = cfg.pos || { left: 40, bottom: 30 };
    var b = document.createElement("button");
    b.type = "button"; b.className = "kiosk-menu"; b.setAttribute("aria-label", "Main menu");
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/></svg><span>Main menu</span>';
    ["left", "right", "top", "bottom"].forEach(function (k) {
      if (pos[k] !== undefined) b.style[k] = "calc(" + pos[k] + " * min(calc(100vw / 1920), calc(100vh / 1080)) + max(0px, (100" + (k == "left" || k == "right" ? "vw - 100vh * 1920 / 1080" : "vh - 100vw * 1080 / 1920") + ") / 2))";
    });
    b.addEventListener("click", function (e) { e.stopPropagation(); window.KIOSK.toMenu(); });
    document.body.appendChild(b);
    var show = cfg.show || function () { return true; };
    setInterval(function () { b.hidden = !show(); }, 250);
    b.hidden = !show();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
