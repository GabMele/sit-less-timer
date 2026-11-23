// Bridge to Tauri: exposes window.native (same interface as when the app was Electron)
(() => {
  const T = window.__TAURI__;
  if (!T || window.native) return;
  const w = T.window.getCurrentWindow();
  const ok = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
  let hideTimer = 0;
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
    // "Save as" dialog + write (Rust command); resolves true if saved, false if the user cancelled
    saveFile: (name, content) => T.core.invoke('save_text_file', { name, content }),
    // ms since the last keyboard/mouse input system-wide (null if unavailable)
    idleMs: () => T.core.invoke('idle_ms'),
    // "Are you still there?" cards on every monitor (o: {seconds, end, lang, bg, fg, accent, warm}); the answer arrives as an event
    showIdlePrompt: (o) => {
      clearTimeout(hideTimer);   // a pending close of the previous cards must not destroy the new ones
      return T.core.invoke('show_idle_prompt', o).catch((e) => console.error('show_idle_prompt', e));
    },
    hideIdlePrompt: () => {
      T.event.emit('idle-close');   // lets the cards fade out before they are destroyed
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => T.core.invoke('hide_idle_prompt').catch(() => {}), 450);
    },
    onIdleYes: (cb) => T.event.listen('idle-yes', cb),
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
