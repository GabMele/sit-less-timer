(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const SVGNS = 'http://www.w3.org/2000/svg';
  const native = window.native || { openExternal(u) { window.open(u, '_blank', 'noopener'); }, setOnTop() {}, getOnTop: async () => false, attention() {}, progress() {}, setTheme() {}, version: async () => '' };
  native.version().then((v) => { if (v) $('#ver').textContent = 'v' + v; }).catch(() => {});

  /* ---------- persistence ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const DEF = { duration: 25, presets: [25, 55], sound: 'chimes', volume: 0.7, reps: 10, every: 3, onTop: false, keep: 30, theme: 'system', accent: 'teal', mode: 'up', dayStart: 4, dayEnd: 4 };
  const S = { ...DEF, ...store.get('timer.settings', {}) };
  if (S.sound !== 'custom' && !Sounds.list.some((x) => x.id === S.sound)) S.sound = DEF.sound;   // sound removed in a previous version
  // migration: the old default presets (27, 52) become the new ones (25, 55)
  if (Array.isArray(S.presets) && S.presets.join() === '27,52') S.presets = DEF.presets;
  if (!I18N.LANGS[S.lang]) S.lang = I18N.detect();
  I18N.setLang(S.lang);
  const t = I18N.t;
  const saveS = () => store.set('timer.settings', S);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* ---------- theme and accent color ---------- */
  // [dark, light]: the light theme needs darker tones for contrast
  const ACCENTS = {
    teal: ['#3fd0b8', '#0f8a76'], blue: ['#6ca0f0', '#2f5fb8'], violet: ['#a78bfa', '#6d4fd0'],
    pink: ['#f27aa8', '#c2336f'], orange: ['#f2a65a', '#b8590a'], green: ['#6fd16f', '#2a8a3a'],
  };
  // activity / break / overtime colors: [dark, light]; the user can override each one in the settings
  const DEFAULT_COLORS = { work: ['#a3e635', '#5a9a0a'], rest: ['#9b84e6', '#6a4fc4'], over: ['#ff8a1f', '#d96a00'] };
  const COLOR_VARS = { work: '--work', rest: '--rest', over: '--warm' };
  const COLOR_INPUTS = { work: '#sColWork', rest: '#sColRest', over: '#sColOver' };
  const THEMES = ['system', 'light', 'dark'];
  if (!THEMES.includes(S.theme)) S.theme = 'system';
  if (!ACCENTS[S.accent]) S.accent = 'teal';
  if (S.mode !== 'up' && S.mode !== 'down') S.mode = 'up';
  for (const k of ['dayStart', 'dayEnd']) S[k] = clamp(Math.round(Number(S[k])) || 0, 0, 23);
  // exactly two quick durations (first / second)
  if (!Array.isArray(S.presets)) S.presets = DEF.presets;
  S.presets = [0, 1].map((i) => clamp(Math.round(Number(S.presets[i])) || DEF.presets[i], 1, 600));
  S.reps = clamp(Math.round(Number(S.reps)) || DEF.reps, 1, 999);
  S.every = clamp(Number(S.every) || DEF.every, 0.5, 999);
  S.colors = { work: null, rest: null, over: null, ...(S.colors && typeof S.colors === 'object' ? S.colors : {}) };
  const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
  function applyTheme() {
    const light = S.theme === 'light' || (S.theme === 'system' && !darkMQ.matches);
    const i = light ? 1 : 0, r = document.documentElement;
    r.dataset.theme = light ? 'light' : 'dark';
    r.style.setProperty('--accent', ACCENTS[S.accent][i]);
    for (const k in COLOR_VARS) {
      const c = S.colors[k] || DEFAULT_COLORS[k][i];
      r.style.setProperty(COLOR_VARS[k], c);
      const inp = $(COLOR_INPUTS[k]); if (inp) inp.value = c;
    }
    const cs = getComputedStyle(r);
    native.setTheme(cs.getPropertyValue('--bg').trim(), cs.getPropertyValue('--dim').trim());
    document.querySelectorAll('.sw').forEach((b) => {
      b.classList.toggle('on', b.dataset.k === S.accent); b.setAttribute('aria-checked', b.dataset.k === S.accent);
    });
  }
  darkMQ.addEventListener('change', applyTheme);

  /* ---------- timer state ---------- */
  let status = 'idle';          // idle | running | paused
  let acc = 0;                  // ms accumulated before the last start
  let startedAt = 0;
  let alertIdx = 0;             // how many alerts have already played

  const elapsedMs = () => acc + (status === 'running' ? Date.now() - startedAt : 0);
  const targetMs = () => S.duration * 60000;
  const everyMs = () => S.every * 60000;

  function syncAlertIdx() {
    const el = elapsedMs(), t = targetMs();
    alertIdx = el < t ? 0 : clamp(Math.floor((el - t) / everyMs()) + 1, 0, S.reps);
  }

  function setStatus(s) { status = s; document.body.dataset.status = s; }

  function start() {
    if (status === 'running') return;
    // starting from idle or resuming after a real break begins a new cycle: dial back to zero.
    // A break shorter than MIN_BREAK is accidental: it is ignored and the cycle just continues.
    let merged = false;
    if (status === 'paused' && breakMs() < MIN_BREAK) merged = mergeShortBreak();
    else if (status === 'idle' || status === 'paused') { acc = 0; alertIdx = 0; }
    startedAt = Date.now();
    setStatus('running');
    if (!merged) seg('a');
    tick();
  }
  function pause() {
    if (status !== 'running') return;
    acc += Date.now() - startedAt;
    setStatus('paused');
    seg('p');
    tick();
  }
  function stop() {
    if (status === 'idle') return;
    acc = 0; alertIdx = 0;
    setStatus('idle');
    seg('p');
    tick();
  }

  /* ---------- activity / break log ---------- */
  const MIN_BREAK = 10000;   // breaks shorter than 10 s are accidental and do not count
  let L = store.get('timer.log', { segs: [], open: null, hb: 0 });
  // undo a too-short break: reopen the activity segment it interrupted, as if it never happened
  function mergeShortBreak() {
    const o = L.open;
    if (!o || o.t !== 'p') return false;
    const prev = L.segs[L.segs.length - 1];
    if (!prev || prev.t !== 'a' || prev.e !== o.s) return false;
    L.segs.pop();
    L.open = { t: 'a', s: prev.s };
    saveLog();
    return true;
  }
  function closeOpen(end) {
    const o = L.open; L.open = null;
    if (!o) return;
    const d = end - o.s;
    if (d < 1000) return;
    if (o.t === 'p' && d < MIN_BREAK) return;
    L.segs.push({ t: o.t, s: o.s, e: end });
  }
  function seg(type) {
    const n = Date.now();
    closeOpen(n);
    L.open = type ? { t: type, s: n } : null;
    saveLog();
  }
  function saveLog() {
    const cutoff = Date.now() - S.keep * 86400e3;
    L.segs = L.segs.filter((x) => x.e > cutoff);
    L.hb = Date.now();
    store.set('timer.log', L);
  }
  if (L.open) closeOpen(clamp(L.hb || Date.now(), L.open.s, Date.now()));
  saveLog();

  // a "day" starts at the configured start hour and lasts 24 h (so activity after the end hour is not lost)
  function dayBounds(off) {
    const d = new Date(); d.setHours(S.dayStart, 0, 0, 0);
    if (d.getTime() > Date.now()) d.setDate(d.getDate() - 1);
    d.setDate(d.getDate() - off);
    const e = new Date(d); e.setDate(e.getDate() + 1);
    return [d.getTime(), e.getTime()];
  }
  function daySegs(off) {
    const [ds, de] = dayBounds(off);
    const all = L.segs.slice();
    if (L.open) all.push({ t: L.open.t, s: L.open.s, e: Date.now() });
    const r = all.map((x) => ({ t: x.t, s: Math.max(x.s, ds), e: Math.min(x.e, de) })).filter((x) => x.e > x.s);
    // breaks count only between the first start and the last activity of the day, whatever their length;
    // the break in progress counts live while the timer is paused
    const first = r.findIndex((x) => x.t === 'a');
    if (first < 0) return [];
    let last = r.length - 1;
    while (r[last].t !== 'a') last--;
    const live = off === 0 && status === 'paused' && L.open && L.open.t === 'p';
    return r.slice(first, live ? r.length : last + 1);
  }
  function stats(off) {
    const segs = daySegs(off);
    let a = 0, p = 0, maxA = 0, nP = 0;
    for (const x of segs) {
      const d = x.e - x.s;
      if (x.t === 'a') { a += d; maxA = Math.max(maxA, d); } else { p += d; nP++; }
    }
    return { segs, a, p, maxA, nP };
  }

  function fmtDur(ms) {
    const s = Math.round(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
  }
  const hhmm = (t) => new Date(t).toLocaleTimeString(I18N.locale(), { hour: '2-digit', minute: '2-digit' });

  /* ---------- dial ---------- */
  const f = (n) => Math.round(n * 100) / 100;
  const polar = (r, deg) => { const a = deg * Math.PI / 180; return [f(r * Math.sin(a)), f(-r * Math.cos(a))]; };
  function arcPath(r, a0, a1) {
    if (a1 - a0 >= 359.99) {
      const [x, y] = polar(r, 0), [x2, y2] = polar(r, 180);
      return `M${x} ${y}A${r} ${r} 0 1 1 ${x2} ${y2}A${r} ${r} 0 1 1 ${x} ${y}`;
    }
    const [x0, y0] = polar(r, a0), [x1, y1] = polar(r, a1);
    return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  }

  // fixed tick marks
  (() => {
    let h = '';
    for (let i = 0; i < 60; i++) {
      const top = i === 0, maj = i % 5 === 0;
      const [x0, y0] = polar(top ? 90 : maj ? 92 : 95, i * 6), [x1, y1] = polar(100, i * 6);
      h += `<line class="tick${top ? ' top' : maj ? ' maj' : ''}" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`;
    }
    $('#ticks').innerHTML = h;
  })();

  const ringsG = $('#rings');
  let lastRings = '';
  // outer ring radius = 86, the center stays free for the text
  function drawRings(el) {
    const T = S.duration, Tms = T * 60000, down = S.mode === 'down', over = el >= Tms;
    // in countdown mode the dial starts full (set duration) and empties; past the time it restarts from 0 in the warm color
    const vMs = down ? (over ? el - Tms : Tms - el) : el;
    const m = vMs / 60000;
    const n = Math.max(Math.floor((down && !over ? 0 : m) / 60), Math.ceil(T / 60) - 1) + 1;
    const step = Math.min(10, 44 / n), th = step * 0.88, thin = th * 0.4;
    const rad = (i) => 86 - th / 2 - i * step;
    let out = '';
    for (let i = 0; i < n; i++) {
      const r = f(rad(i)), a = i * 60, b = a + 60;
      const seg = (x0, x1, cls) => {
        const w = cls === 'plan' ? thin : th;
        const lo = Math.max(x0, a), hi = Math.min(x1, b);
        if (hi - lo <= 0.0005) return '';
        return `<path class="${cls}" d="${arcPath(r, (lo - a) * 6, (hi - a) * 6)}" stroke-width="${f(w)}"/>`;
      };
      out += `<circle class="track" r="${r}" stroke-width="${f(thin)}"/>` + seg(0, T, 'plan') +
        (down ? (over ? seg(0, m, 'over') : seg(0, m, 'done')) : seg(0, Math.min(m, T), 'done') + seg(T, m, 'over'));
    }
    // goal marker
    const k = Math.ceil(T / 60) - 1, rk = rad(k), ang = (T - k * 60) * 6;
    const [mx0, my0] = polar(rk + th / 2 + 1.5, ang), [mx1, my1] = polar(rk - th / 2 - 1.5, ang);
    out += `<line class="mark" x1="${mx0}" y1="${my0}" x2="${mx1}" y2="${my1}"/>`;
    // hand (one turn per hour) and seconds dot (one turn per minute)
    const ha = (m % 60) * 6;
    const [hx0, hy0] = polar(42, ha), [hx1, hy1] = polar(90, ha);
    out += `<line class="hand" x1="${hx0}" y1="${hy0}" x2="${hx1}" y2="${hy1}"/>`;
    const [sx, sy] = polar(88.5, ((vMs / 1000) % 60) * 6);
    out += `<circle class="sec" cx="${sx}" cy="${sy}" r="1.3"/>`;
    if (out !== lastRings) { ringsG.innerHTML = out; lastRings = out; }
  }

  // length of the break in progress (0 unless paused); resets when the timer resumes or stops
  const breakMs = () => (status === 'paused' && L.open && L.open.t === 'p' ? Date.now() - L.open.s : 0);
  const breakShown = () => { const b = breakMs(); return b >= MIN_BREAK ? b : 0; };

  // current break: thin arc attached to the outer work ring, one lap per hour
  const pauseG = $('#pauseRing');
  let lastPauseRing = '';
  function drawPause(ms) {
    // flush against the outer work ring (its outer edge is at r=86); only the real break sector is drawn
    const m = ms / 60000, R = 86 + 1.1, rem = m % 60;
    let out = '';
    if (ms >= 1000 && rem > 0.0005) out = `<path class="parc" d="${arcPath(R, 0, rem * 6)}"/>`;
    else if (ms >= 1000) out = `<circle class="parc" r="${R}"/>`;
    if (out !== lastPauseRing) { pauseG.innerHTML = out; lastPauseRing = out; }
  }

  // daily bar: fixed scale from the configured day start to day end (an end equal to or before the start means the
  // next day; activity past the end stretches the scale to its hour); empty until the first start
  const dayTl = $('#dayTl'), dayFrom = $('#dayFrom'), dayTot = $('#dayTot'), dayTo = $('#dayTo');
  let lastDay = '', lastDaySec = 0;
  let dayView = { t0: 0, span: 1, segs: [] }; // scale of the bar as last drawn, used by the hover hint

  // hover hint: time under the cursor, or the start-end of the segment under it
  const dayTip = document.createElement('div');
  dayTip.id = 'dayTip';
  document.body.appendChild(dayTip);
  dayTl.addEventListener('mousemove', (e) => {
    const r = dayTl.getBoundingClientRect();
    const at = dayView.t0 + ((e.clientX - r.left) / r.width) * dayView.span;
    const seg = dayView.segs.find((x) => at >= x.s && at <= x.e);
    dayTip.textContent = seg ? `${hhmm(seg.s)} – ${hhmm(seg.e)} · ${fmtDur(seg.e - seg.s)}` : hhmm(at);
    dayTip.className = seg ? seg.t : '';
    dayTip.style.display = 'block';
    const w = dayTip.offsetWidth;
    dayTip.style.left = Math.max(4, Math.min(e.clientX - w / 2, window.innerWidth - w - 4)) + 'px';
    dayTip.style.top = (r.top - dayTip.offsetHeight - 6) + 'px';
  });
  dayTl.addEventListener('mouseleave', () => { dayTip.style.display = 'none'; });

  function drawDay() {
    const sec = Math.floor(Date.now() / 1000);
    if (sec === lastDaySec) return;
    lastDaySec = sec;
    const st = stats(0);
    const [ds, de] = dayBounds(0);
    const t0 = ds;
    let t1 = ds + (((S.dayEnd - S.dayStart + 24) % 24) || 24) * 3600e3;
    const lastEnd = st.segs.length ? st.segs[st.segs.length - 1].e : 0;
    if (lastEnd > t1) { const d = new Date(lastEnd); d.setMinutes(0, 0, 0); t1 = Math.min(d.getTime() + 3600e3, de); }
    const span = t1 - t0;
    dayView = { t0, span, segs: st.segs };
    let tl = '', tot = '';
    if (st.segs.length) {
      tl = st.segs.map((x) => `<i class="${x.t}" style="left:${((x.s - t0) / span) * 100}%;width:${Math.max(((x.e - x.s) / span) * 100, 0.3)}%"></i>`).join('');
      tot = `<span class="k a">${fmtDur(st.a)}</span><span class="k p">${fmtDur(st.p)}</span>`;
    }
    const from = hhmm(t0), to = hhmm(t1);
    const key = tl + '|' + from + '|' + to + '|' + tot;
    if (key === lastDay) return;
    lastDay = key;
    dayTl.innerHTML = tl; dayFrom.textContent = from; dayTo.textContent = to; dayTot.innerHTML = tot;
  }

  function fmtClock(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    const p = (v) => String(v).padStart(2, '0');
    return h > 0 ? `${h}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`;
  }

  const tMain = $('#tMain'), tTop = $('#tTop'), tBot = $('#tBot');
  let lastProg = '';
  function render(el) {
    drawRings(el);
    drawPause(breakShown());
    drawDay();
    const T = targetMs(), over = el >= T;
    const down = S.mode === 'down';
    const txt = down
      ? (status === 'idle' ? fmtClock(T) : over ? '+' + fmtClock(el - T) : fmtClock(Math.ceil((T - el) / 1000) * 1000))
      : fmtClock(el);
    tMain.textContent = txt;
    tMain.classList.toggle('long', txt.length > 5);
    tMain.classList.toggle('over', over);
    tTop.textContent = status === 'idle' ? t('ready') : status === 'paused' ? t('paused') : down ? (over ? t('beyond') : t('remaining')) : t('elapsed');
    tBot.classList.toggle('over', over);
    tBot.textContent = status === 'idle' ? '' : down
      ? (over ? `${alertIdx}/${S.reps}` : t('spent', fmtClock(el)))
      : over ? t('over', fmtClock(el - T), `${alertIdx}/${S.reps}`) : t('left', fmtClock(Math.ceil((T - el) / 1000) * 1000));
    document.title = status === 'idle' ? 'Sit-less Timer' : `${txt} – Sit-less Timer`;

    // taskbar
    let key;
    if (status === 'idle') key = 'off';
    else if (over) key = 'over';
    else key = 'p' + Math.round((el / T) * 100);
    if (key !== lastProg) {
      lastProg = key;
      if (key === 'off') native.progress(-1);
      else if (key === 'over') native.progress(1, 'error');
      else native.progress(Math.min(el / T, 1), status === 'paused' ? 'paused' : 'normal');
    }
  }

  /* ---------- tick loop ---------- */
  function fire() {
    Sounds.play(S.sound, S.volume);
    native.attention();
    const st = $('#stage');
    st.classList.remove('pulse'); void st.offsetWidth; st.classList.add('pulse');
  }
  let lastHb = 0;
  function tick() {
    const el = elapsedMs();
    if (status === 'running') {
      // after the PC sleeps several alerts may have expired: play only one
      let due = 0;
      while (alertIdx < S.reps && el >= targetMs() + alertIdx * everyMs()) {
        alertIdx++;
        due++;
      }
      if (due) fire();
    }
    // heartbeat also while paused/stopped, so a break in progress survives an app restart
    if (status !== 'idle' && Date.now() - lastHb > 5000) { lastHb = Date.now(); saveLog(); }
    render(el);
  }
  setInterval(tick, 200);

  /* ---------- top bar ---------- */
  function refreshToday() {
    const st = stats(0);
    $('#today').textContent = st.a + st.p === 0 ? t('today_none') : t('today_fmt', fmtDur(st.a), fmtDur(st.p));
  }
  setInterval(refreshToday, 10000);

  /* ---------- duration ---------- */
  const chipsEl = $('#chips'), durIn = $('#durIn'), durEdit = $('#durEdit');
  let otherBtn, prevDur = S.duration;
  function buildChips() {
    chipsEl.innerHTML = '';
    for (const p of S.presets) {
      const b = document.createElement('button');
      b.className = 'chip'; b.textContent = p + ' min'; b.dataset.v = p;
      b.addEventListener('click', () => setDuration(p));
      chipsEl.appendChild(b);
    }
    // last chip: custom duration (shows the value if it is not a preset)
    otherBtn = document.createElement('button');
    otherBtn.className = 'chip other'; otherBtn.title = t('title_other');
    otherBtn.addEventListener('click', openEdit);
    chipsEl.appendChild(otherBtn);
    markChips();
  }
  function markChips() {
    const preset = S.presets.includes(S.duration);
    chipsEl.querySelectorAll('.chip[data-v]').forEach((c) => c.classList.toggle('on', Number(c.dataset.v) === S.duration));
    otherBtn.classList.toggle('on', !preset);
    otherBtn.textContent = '✎ ' + (preset ? t('other') : S.duration + ' min');
    if (document.activeElement !== durIn) durIn.value = S.duration;
  }
  function openEdit() {
    prevDur = S.duration;
    chipsEl.hidden = true; durEdit.hidden = false;
    durIn.focus(); durIn.select();
  }
  function closeEdit() {
    durEdit.hidden = true; chipsEl.hidden = false;
    durIn.value = S.duration; markChips();
  }
  function setDuration(v) {
    v = Math.round(Number(v));
    if (!(v >= 1)) return;
    S.duration = clamp(v, 1, 600);
    saveS(); syncAlertIdx(); markChips(); lastProg = ''; tick();
  }
  // − / +: mousedown must not take focus from the field, otherwise editing closes
  for (const [id, d] of [['#durDec', -1], ['#durInc', 1]]) {
    const b = $(id);
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => { setDuration(clamp(S.duration + d, 1, 600)); durIn.value = S.duration; });
  }
  durIn.addEventListener('input', () => { const v = Number(durIn.value); if (v >= 1) setDuration(v); });
  durIn.addEventListener('blur', closeEdit);
  durIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') durIn.blur();
    else if (e.key === 'Escape') { setDuration(prevDur); durIn.blur(); }
  });

  /* ---------- buttons ---------- */
  $('#btnGo').addEventListener('click', () => (status === 'running' ? pause() : start()));
  $('#btnStop').addEventListener('click', stop);
  window.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.key === 'Escape') return closePanels();
    if (e.code === 'Space' && tag !== 'input' && tag !== 'select' && tag !== 'button') {
      e.preventDefault();
      status === 'running' ? pause() : start();
    }
  });

  /* ---------- panels ---------- */
  const pSet = $('#pSet'), pSum = $('#pSum'), pAbout = $('#pAbout');
  function closePanels() {
    pSet.classList.remove('open'); pSum.classList.remove('open'); pAbout.classList.remove('open');
    $('#btnSet').classList.remove('on'); $('#btnSum').classList.remove('on'); $('#btnAbout').classList.remove('on');
  }
  function toggle(panel, btn) {
    const was = panel.classList.contains('open');
    closePanels();
    if (!was) { panel.classList.add('open'); btn.classList.add('on'); if (panel === pSum) renderSummary(); }
  }
  $('#btnSet').addEventListener('click', () => toggle(pSet, $('#btnSet')));
  $('#btnSum').addEventListener('click', () => toggle(pSum, $('#btnSum')));
  $('#btnAbout').addEventListener('click', () => toggle(pAbout, $('#btnAbout')));

  // settings
  const sSound = $('#sSound'), sLang = $('#sLang');
  function buildSoundOptions() {
    sSound.innerHTML = '';
    for (const g of Sounds.groups) {
      const og = document.createElement('optgroup');
      og.label = I18N.groupName(g);
      for (const s of Sounds.list.filter((x) => x.group === g)) {
        const o = document.createElement('option');
        o.value = s.id; o.textContent = I18N.soundName(s.id, s.name); og.appendChild(o);
      }
      sSound.appendChild(og);
    }
    sSound.value = S.sound;
  }
  buildSoundOptions();
  const customMsg = $('#customMsg'), sUnload = $('#sUnload');
  function syncCustom(err) {
    sUnload.hidden = !Sounds.hasCustom;
    customMsg.textContent = err ? I18N.t(err) : I18N.t('custom_hint');
    customMsg.style.color = err ? 'var(--accent)' : '';
  }
  Sounds.loadCustom().then(() => {
    if (S.sound === 'custom' && !Sounds.hasCustom) { S.sound = DEF.sound; saveS(); }
    buildSoundOptions(); syncCustom();
  });
  $('#sLoad').addEventListener('click', () => $('#sFile').click());
  $('#sFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      await Sounds.setCustom(f);
      S.sound = 'custom'; saveS(); buildSoundOptions(); syncCustom();
      Sounds.play(S.sound, S.volume);
    } catch (err) { syncCustom(err.message === 'size' ? 'custom_err_size' : 'custom_err_fmt'); }
  });
  sUnload.addEventListener('click', async () => {
    await Sounds.clearCustom();
    if (S.sound === 'custom') { S.sound = DEF.sound; saveS(); }
    buildSoundOptions(); syncCustom();
  });
  for (const [k, v] of Object.entries(I18N.LANGS)) {
    const o = document.createElement('option'); o.value = k; o.textContent = v; sLang.appendChild(o);
  }
  sLang.value = S.lang;

  const sTheme = $('#sTheme'), sAccent = $('#sAccent');
  function buildThemeOptions() {
    sTheme.innerHTML = '';
    for (const k of THEMES) {
      const o = document.createElement('option'); o.value = k; o.textContent = t('th_' + k); sTheme.appendChild(o);
    }
    sTheme.value = S.theme;
    sAccent.querySelectorAll('.sw').forEach((b) => { b.title = b.ariaLabel = t('ac_' + b.dataset.k); });
  }
  for (const k of Object.keys(ACCENTS)) {
    const b = document.createElement('button');
    b.className = 'sw'; b.dataset.k = k; b.setAttribute('role', 'radio'); b.style.setProperty('--c', ACCENTS[k][0]);
    b.addEventListener('click', () => { S.accent = k; saveS(); applyTheme(); });
    sAccent.appendChild(b);
  }
  const sMode = $('#sMode');
  function buildModeOptions() {
    sMode.innerHTML = '';
    for (const k of ['up', 'down']) {
      const o = document.createElement('option'); o.value = k; o.textContent = t('mode_' + k); sMode.appendChild(o);
    }
    sMode.value = S.mode;
  }
  function setMode(m) { S.mode = m; saveS(); sMode.value = m; tick(); }
  sMode.addEventListener('change', () => setMode(sMode.value));
  tMain.addEventListener('click', () => setMode(S.mode === 'up' ? 'down' : 'up'));
  buildModeOptions();
  sTheme.addEventListener('change', () => { S.theme = sTheme.value; saveS(); applyTheme(); });
  buildThemeOptions();
  sLang.addEventListener('change', () => {
    S.lang = sLang.value; saveS(); I18N.setLang(S.lang); I18N.apply();
    buildSoundOptions(); buildKeepOptions(); buildThemeOptions(); buildModeOptions(); buildChips(); refreshToday(); tick();
    if (pSum.classList.contains('open')) renderSummary();
  });
  sSound.value = S.sound;
  $('#sVol').value = S.volume;
  $('#sReps').value = S.reps;
  $('#sEvery').value = S.every;
  $('#sPre1').value = S.presets[0];
  $('#sPre2').value = S.presets[1];
  $('#sTop').checked = !!S.onTop;
  native.setOnTop(S.onTop);
  // launch at login: only in the desktop app, and the checkbox mirrors the real OS state
  if (window.native && native.getAutostart) {
    const sAuto = $('#sAuto');
    $('#rowAuto').hidden = false;
    native.getAutostart().then((v) => { sAuto.checked = !!v; }).catch(() => { $('#rowAuto').hidden = true; });
    sAuto.addEventListener("change", () => {
      native.setAutostart(sAuto.checked).catch(() => { sAuto.checked = !sAuto.checked; });
    });
  }

  sSound.addEventListener('change', () => { S.sound = sSound.value; saveS(); Sounds.play(S.sound, S.volume); });
  const sPlay = $('#sPlay');
  const PLAY_ICON = '<path d="M8 5.5v13l11-6.5z"/>', STOP_ICON = '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/>';
  Sounds.onState = (playing) => {
    sPlay.querySelector('svg').innerHTML = playing ? STOP_ICON : PLAY_ICON;
    sPlay.title = t(playing ? 'stop' : 'play');
    sPlay.setAttribute('aria-label', sPlay.title);
  };
  sPlay.addEventListener('click', () => { if (Sounds.playing) Sounds.stop(); else Sounds.play(S.sound, S.volume); });
  $('#sVol').addEventListener('change', () => { S.volume = Number($('#sVol').value); saveS(); Sounds.play(S.sound, S.volume); });
  // numeric fields accept at most 3 integer digits (registered before the handlers below, so they see the trimmed value)
  const limitDigits = (el, n = 3) => el.addEventListener('input', () => {
    const [i, f] = el.value.split('.');
    if (i.length > n) el.value = i.slice(0, n) + (f !== undefined ? '.' + f : '');
  });
  for (const el of [$('#sReps'), $('#sEvery'), $('#sPre1'), $('#sPre2'), durIn]) limitDigits(el);
  $('#sReps').addEventListener('input', () => {
    const v = Math.round(Number($('#sReps').value));
    if (v >= 1) { S.reps = clamp(v, 1, 999); saveS(); syncAlertIdx(); }
  });
  $('#sEvery').addEventListener('input', () => {
    const v = Number($('#sEvery').value);
    if (v >= 0.5) { S.every = clamp(v, 0.5, 999); saveS(); syncAlertIdx(); }
  });
  [$('#sPre1'), $('#sPre2')].forEach((el, idx) => {
    el.addEventListener('input', () => {
      const v = Math.round(Number(el.value));
      if (v >= 1) { S.presets[idx] = clamp(v, 1, 600); saveS(); buildChips(); }
    });
    el.addEventListener('change', () => { el.value = S.presets[idx]; });   // restore a valid value if left empty / out of range
  });
  for (const k in COLOR_INPUTS) {
    $(COLOR_INPUTS[k]).addEventListener('input', (e) => { S.colors[k] = e.target.value; saveS(); applyTheme(); });
  }
  $('#sColReset').addEventListener('click', () => { S.colors = { work: null, rest: null, over: null }; saveS(); applyTheme(); });
  const sKeep = $('#sKeep');
  function buildKeepOptions() {
    sKeep.innerHTML = '';
    // values are days; shown as days up to 15 and as months from 30 (30 d = 1 month, 90 d = 3, 180 d = 6)
    for (const d of [7, 15, 30, 90, 180]) {
      const o = document.createElement('option'); o.value = d;
      o.textContent = d < 30 ? t('days', d) : d === 30 ? t('month_1') : t('months', d / 30);
      sKeep.appendChild(o);
    }
    sKeep.value = S.keep;
  }
  buildKeepOptions();
  sKeep.addEventListener('change', () => { S.keep = Number(sKeep.value); saveS(); saveLog(); refreshToday(); });
  const sDayStart = $('#sDayStart'), sDayEnd = $('#sDayEnd');
  for (const sel of [sDayStart, sDayEnd]) {
    for (let h = 0; h < 24; h++) {
      const o = document.createElement('option'); o.value = h; o.textContent = String(h).padStart(2, '0') + ':00'; sel.appendChild(o);
    }
  }
  sDayStart.value = S.dayStart; sDayEnd.value = S.dayEnd;
  const onDayChange = () => {
    S.dayStart = Number(sDayStart.value); S.dayEnd = Number(sDayEnd.value);
    saveS(); lastDay = ''; lastDaySec = 0; refreshToday(); tick();
  };
  sDayStart.addEventListener('change', onDayChange);
  sDayEnd.addEventListener('change', onDayChange);
  $('#sClear').addEventListener('click', () => {
    if (!confirm(t('clear_q'))) return;
    L.segs = [];
    if (L.open) L.open.s = Date.now();
    saveLog(); refreshToday();
    if (pSum.classList.contains('open')) renderSummary();
  });
  $('#sTop').addEventListener('change', () => { S.onTop = $('#sTop').checked; saveS(); native.setOnTop(S.onTop); });

  // summary
  const DAYF = { weekday: 'short', day: 'numeric', month: 'short' };
  function renderSummary() {
    const st = stats(0);
    const tot = Math.max(1, st.a + st.p);
    const pct = (v) => Math.min(100, Math.max(0, v) * 100).toFixed(1);
    const bar = (cls, f) => `<em class="tb"><i class="${cls}" style="width:${pct(f)}%"></i></em>`;
    let h = `<div class="tiles">
      <div class="tile a"><b>${fmtDur(st.a)}</b><span>${t('tile_a')}</span>${bar('a', st.a / tot)}</div>
      <div class="tile p"><b>${fmtDur(st.p)}</b><span>${t('tile_p')}</span>${bar('p', st.p / tot)}</div>
      <div class="tile"><b>${fmtDur(st.maxA)}</b><span>${t('tile_max')}</span>${bar('a', st.a ? st.maxA / st.a : 0)}</div>
      <div class="tile"><b>${st.nP}</b><span>${t('tile_n')}</span>${bar('p', Math.min(st.nP / 10, 1))}</div>
    </div>`;
    if (st.segs.length) {
      const t0 = st.segs[0].s, t1 = Math.max(st.segs[st.segs.length - 1].e, t0 + 60000), span = t1 - t0;
      h += `<div class="sub">${t('day')}</div><div class="tl">` +
        st.segs.map((x) => `<i class="${x.t}" style="left:${((x.s - t0) / span) * 100}%;width:${Math.max(((x.e - x.s) / span) * 100, 0.4)}%"></i>`).join('') +
        `</div><div class="tlab"><span>${hhmm(t0)}</span><span>${hhmm(t1)}</span></div>`;
    } else {
      h += `<p class="empty">${t('empty')}</p>`;
    }
    const days = [0, 1, 2, 3, 4, 5, 6].map((o) => ({ o, ...stats(o) }));
    const max = Math.max(1, ...days.map((d) => d.a + d.p));
    h += `<div class="sub">${t('last7')}</div>`;
    for (const d of days) {
      const date = new Date(); date.setDate(date.getDate() - d.o);
      const wd = date.toLocaleDateString(I18N.locale(), { weekday: 'short' }).replace('.', '');
      const dm = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      h += `<div class="day"><span>${d.o === 0 ? t('today') : `${wd} ${dm}`}</span>
        <div class="bars"><i class="a" style="width:${(d.a / max) * 100}%"></i><i class="p" style="width:${(d.p / max) * 100}%"></i></div>
        <small title="${t('act')} / ${t('brk')}">${fmtDur(d.a)} · ${fmtDur(d.p)}</small></div>`;
    }
    h += `<p class="hint">${t('sum_hint')}</p>`;
    $('#sumBody').innerHTML = h;
  }
  setInterval(() => { if (pSum.classList.contains('open')) renderSummary(); }, 5000);

  /* ---------- CSV export ---------- */
  const p2 = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  const hms = (ms) => { const d = new Date(ms); return `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`; };
  // one row per activity / break over the whole kept history; "day" follows the configured day start.
  // English uses "," and "."; the other languages use ";" and a decimal comma (what their Excel expects)
  function buildCsv() {
    const en = S.lang === 'en', sep = en ? ',' : ';';
    const q = (v) => { v = String(v); return v.includes(sep) || /["\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const rows = [[t('csv_day'), t('csv_start'), t('csv_end'), t('csv_type'), t('csv_min')]];
    for (let off = S.keep; off >= 0; off--) {
      const day = ymd(new Date(dayBounds(off)[0]));
      for (const x of daySegs(off)) {
        const m = ((x.e - x.s) / 60000).toFixed(1);
        rows.push([day, hms(x.s), hms(x.e), t(x.t === 'a' ? 'act' : 'brk'), en ? m : m.replace('.', ',')]);
      }
    }
    return '﻿' + rows.map((r) => r.map(q).join(sep)).join('\r\n') + '\r\n';
  }
  $('#sExport').addEventListener('click', async () => {
    const name = `sit-less-timer-${ymd(new Date())}.csv`, csv = buildCsv();
    try {
      if (window.native && native.saveFile) {
        await native.saveFile(name, csv);   // desktop app: "Save as" dialog
      } else {
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a'); a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch { alert(t('export_err')); }
  });

  window.addEventListener('beforeunload', saveLog);

  document.querySelectorAll('.ext').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    native.openExternal(a.dataset.url || 'https://nextquo.com/?utm_source=timer-app&utm_medium=app');
  }));

  /* ---------- startup ---------- */
  I18N.apply();
  applyTheme();
  buildChips();
  refreshToday();
  tick();
})();
