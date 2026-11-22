// "Are you still there?" overlay. Parameters come from the query string (set by the Rust side, already validated):
//   s = total countdown in seconds, end = deadline (epoch ms), lang, h / v = position (decides which edge the growth is
//   anchored to), ca / cb = gradient colors, tx = text color, pl = plate color (hex without '#').
// The window itself is small first and resized to full size by the Rust side; the 400x240 card is scaled to fit the
// current window size, so there is no continuous scaling here.
(() => {
  const q = new URLSearchParams(location.search);
  const hex = (v, d) => (/^[0-9a-f]{6}$/i.test(v || '') ? '#' + v : d);
  const root = document.documentElement.style;
  root.setProperty('--ca', hex(q.get('ca'), '#ff9f1c'));
  root.setProperty('--cb', hex(q.get('cb'), '#e8457c'));
  root.setProperty('--tx', hex(q.get('tx'), '#101616'));
  root.setProperty('--pl', hex(q.get('pl'), '#ffffff'));

  I18N.setLang(q.get('lang'));
  const t = I18N.t;
  const total = Math.min(120, Math.max(5, Number(q.get('s')) || 20)) * 1000;
  const end = Number(q.get('end')) || Date.now() + total;   // same machine, so the clocks of both windows agree

  const $ = (id) => document.getElementById(id);
  const card = $('card'), num = $('num'), sub = $('sub'), bar = $('bar').firstElementChild;
  // fit the fixed-size card to the window (it is small first, then full size)
  const fit = () => { card.style.transform = `scale(${window.innerWidth / 400})`; };
  fit();
  window.addEventListener('resize', fit);
  $('h').textContent = t('idle_h');
  $('yes').textContent = t('idle_yes');
  document.documentElement.lang = I18N.lang;

  const T = window.__TAURI__;
  $('yes').addEventListener('click', () => { if (T) T.event.emit('idle-yes'); });
  if (T) T.event.listen('idle-close', () => card.classList.add('out'));
  // the window is resized in between: the page fades out, then back in
  if (T) {
    T.event.listen('idle-grow-start', () => document.body.classList.add('dip'));
    T.event.listen('idle-grow-end', () => document.body.classList.remove('dip'));
  }

  let shown = -1;
  function frame() {
    const left = Math.max(0, end - Date.now());
    const el = total - left;
    const secs = Math.ceil(left / 1000);
    if (secs !== shown) {
      shown = secs;
      num.textContent = secs;
      sub.textContent = t('idle_sub', secs);
    }
    bar.style.width = Math.min(100, (el / total) * 100) + '%';
    if (left > 0) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
