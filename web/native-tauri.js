// Bridge to Tauri: exposes window.native (same interface as when the app was Electron)
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
        if (x.protocol === 'https:' && ['nextquo.com', 'www.nextquo.com', 'ko-fi.com'].includes(x.hostname)) T.opener.openUrl(x.href);
      } catch {}
    },
    // launch at Windows login (the OS registry is the source of truth, not localStorage)
    getAutostart: () => T.autostart.isEnabled(),
    setAutostart: (v) => (v ? T.autostart.enable() : T.autostart.disable()),
    attention: () => w.requestUserAttention(2),
    setTheme: (bg) => { if (ok(bg)) w.setBackgroundColor(bg).catch(() => {}); },
    version: () => T.app.getVersion(),
    progress: (v, mode) => {
      if (v < 0) return w.setProgressBar({ status: 'none' });
      const status = mode === 'error' ? 'error' : mode === 'paused' ? 'paused' : 'normal';
      return w.setProgressBar({ status, progress: Math.round(Math.min(Math.max(v, 0), 1) * 100) });
    },
  };

  // custom window buttons
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('wc').hidden = false;
    document.getElementById('wMin').addEventListener('click', () => w.minimize());
    document.getElementById('wMax').addEventListener('click', () => w.toggleMaximize());
    document.getElementById('wClose').addEventListener('click', () => w.close());

    // resize grip in the bottom-right corner; it pulses for ~3 s on the very first launch
    const grip = document.getElementById('grip');
    grip.hidden = false;
    grip.addEventListener('mousedown', (e) => { if (e.button === 0) { e.preventDefault(); w.startResizeDragging('SouthEast'); } });
    try {
      if (!localStorage.getItem('timer.gripHint')) {
        localStorage.setItem('timer.gripHint', '1');
        grip.classList.add('hint');
      }
    } catch {}
  });
})();
