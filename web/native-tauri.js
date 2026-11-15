// Ponte verso Tauri: espone window.native (stessa interfaccia di quando l'app era Electron)
(() => {
  const T = window.__TAURI__;
  if (!T || window.native) return;
  const w = T.window.getCurrentWindow();
  const ok = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
  window.native = {
    setOnTop: (v) => w.setAlwaysOnTop(!!v),
    getOnTop: () => w.isAlwaysOnTop(),
    openExternal: (u) => {
      try {
        const x = new URL(u);
        if (x.protocol === 'https:' && (x.hostname === 'nextquo.com' || x.hostname === 'www.nextquo.com')) T.opener.openUrl(x.href);
      } catch {}
    },
    attention: () => w.requestUserAttention(2),
    setTheme: (bg) => { if (ok(bg)) w.setBackgroundColor(bg).catch(() => {}); },
    version: () => T.app.getVersion(),
    progress: (v, mode) => {
      if (v < 0) return w.setProgressBar({ status: 'none' });
      const status = mode === 'error' ? 'error' : mode === 'paused' ? 'paused' : 'normal';
      return w.setProgressBar({ status, progress: Math.round(Math.min(Math.max(v, 0), 1) * 100) });
    },
  };

  // pulsanti della finestra personalizzata
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('wc').hidden = false;
    document.getElementById('wMin').addEventListener('click', () => w.minimize());
    document.getElementById('wMax').addEventListener('click', () => w.toggleMaximize());
    document.getElementById('wClose').addEventListener('click', () => w.close());
  });
})();
