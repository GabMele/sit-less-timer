// gentle sounds and public-domain classical melodies synthesized with WebAudio (no audio files needed)
const Sounds = (() => {
  let ctx, master, bus, conv, current;
  let custom = null;   // the user's own sound: { name, buffer }
  const CUSTOM_MAX = 30, CUSTOM_FADE = 3, CUSTOM_BYTES = 10 * 1024 * 1024;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);

    // soft reverb generated from decaying noise
    const len = Math.floor(ctx.sampleRate * 2.4);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    conv = ctx.createConvolver();
    conv.buffer = buf;
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    conv.connect(wet);
    wet.connect(master);
  }

  function newBus(dry) {
    const b = ctx.createGain();
    b.connect(master);
    if (!dry) b.connect(conv);
    return b;
  }

  // stop the current sound with a quick fade-out
  let playEnd = 0, endTimer = null, onState = null;   // expected end of the current sound
  const notify = (p) => { if (onState) onState(p); };
  function stop() {
    clearTimeout(endTimer);
    if (!current) return;
    notify(false);
    const b = current;
    current = null;
    const t = ctx.currentTime;
    b.gain.cancelScheduledValues(t);
    b.gain.setValueAtTime(b.gain.value, t);
    b.gain.linearRampToValueAtTime(0, t + 0.06);
    setTimeout(() => { try { b.disconnect(); } catch (e) {} }, 150);
  }

  const STRETCH = 2.2;   // lengthens the sound tails
  const REPEAT = new Set(['drops', 'bubble', 'bird', 'wood', 'marimba', 'kalimba', 'celesta', 'piano', 'harp']);
  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  const N = { C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81, B5: 83, C6: 84, D6: 86, E6: 88, G6: 91, C7: 96 };

  // Note: series of partials [ratio, gain, duration multiplier]
  function tone(f, t, o = {}) {
    const { dur: d0 = 1.5, gain = 0.25, type = 'sine', attack = 0.004, partials = [[1, 1, 1]], vib = 0, glide = null, detune = 0 } = o;
    const { sustain = false, rel = 1 } = o;
    const dur = sustain ? d0 : d0 * STRETCH;
    for (const [ratio, g, dm] of partials) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = type;
      osc.detune.value = detune;
      const fr = f * ratio;
      if (glide) {
        osc.frequency.setValueAtTime(fr * glide.from, t);
        osc.frequency.exponentialRampToValueAtTime(fr, t + glide.time);
      } else {
        osc.frequency.value = fr;
      }
      const end = t + dur * dm;
      playEnd = Math.max(playEnd, end + 0.1);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(g * gain, t + attack);
      if (sustain) env.gain.setValueAtTime(g * gain, Math.max(t + attack, end - rel));
      env.gain.exponentialRampToValueAtTime(0.0001, end);
      if (vib) {
        const lfo = ctx.createOscillator();
        const lg = ctx.createGain();
        lfo.frequency.value = 5;
        lg.gain.value = fr * vib;
        lfo.connect(lg);
        lg.connect(osc.frequency);
        lfo.start(t);
        lfo.stop(end + 0.1);
      }
      osc.connect(env);
      env.connect(bus);
      osc.start(t);
      osc.stop(end + 0.1);
    }
  }

  const BOWL = [[1, 1, 1], [2.76, 0.35, 0.5], [5.4, 0.15, 0.3]];
  const GLOCK = [[1, 1, 1], [2.76, 0.3, 0.4], [5.4, 0.18, 0.2]];
  const MARIMBA = [[1, 1, 1], [4, 0.25, 0.15]];
  const KALIMBA = [[1, 1, 1], [6.2, 0.1, 0.12]];
  const HARP = [[1, 1, 1], [2, 0.4, 0.6], [3, 0.2, 0.4]];
  const PIANO = [[1, 1, 1], [2, 0.5, 0.7], [3, 0.25, 0.5], [4, 0.12, 0.3]];
  const CELESTA = [[1, 1, 1], [2, 0.15, 0.6], [4, 0.3, 0.3]];
  const VIBES = [[1, 1, 1], [4, 0.35, 0.3]];
  const GLASS = [[1, 1, 1], [2.32, 0.5, 0.7], [4.25, 0.3, 0.5], [6.63, 0.15, 0.3]];
  const GONG = [[1, 1, 1], [1.5, 0.4, 0.8], [2.2, 0.3, 0.6], [3.1, 0.2, 0.4]];

  const seq = (notes, t, step, o) => notes.forEach((n, i) => tone(hz(n), t + i * step * 1.6, o));

  // --- public-domain melodies (composers dead for over 70 years), played by the synthesizer ---
  // notes: [MIDI note, start beat, duration in beats, optional gain]
  const melPiece = (beat, timbre, notes, gain = 0.2) => (t) => notes.forEach(([n, b, d, g]) =>
    tone(hz(n), t + b * beat, { dur: Math.max(0.8, d * beat * 0.9), gain: g ?? gain, attack: 0.01, partials: timbre }));

  const FUR_ELISE = [
    [76, 0, 1], [75, 1, 1], [76, 2, 1], [75, 3, 1], [76, 4, 1], [71, 5, 1], [74, 6, 1], [72, 7, 1], [69, 8, 2],
    [45, 8, 1, 0.17], [52, 9, 1, 0.17], [57, 10, 1, 0.17],
    [60, 11, 1], [64, 12, 1], [69, 13, 1], [71, 14, 2],
    [40, 14, 1, 0.17], [52, 15, 1, 0.17], [56, 16, 1, 0.17],
    [64, 17, 1], [68, 18, 1], [71, 19, 1], [72, 20, 2],
    [45, 20, 1, 0.17], [52, 21, 1, 0.17], [57, 22, 1, 0.17],
    [76, 22, 1], [75, 23, 1], [76, 24, 1], [75, 25, 1], [76, 26, 1], [71, 27, 1], [74, 28, 1], [72, 29, 1], [69, 30, 5],
    [45, 22, 1, 0.17], [52, 23, 1, 0.17], [57, 24, 1, 0.17], [45, 25, 1, 0.17], [52, 26, 1, 0.17], [57, 27, 1, 0.17], [45, 28, 1, 0.17], [52, 29, 1, 0.17], [45, 30, 1.5, 0.17], [57, 31.5, 4, 0.17]];

  const ODE_TO_JOY = [
    [64, 0, 1], [64, 1, 1], [65, 2, 1], [67, 3, 1], [67, 4, 1], [65, 5, 1], [64, 6, 1], [62, 7, 1],
    [60, 8, 1], [60, 9, 1], [62, 10, 1], [64, 11, 1], [64, 12, 1.5], [62, 13.5, 0.5], [62, 14, 2.5],
    [48, 0, 4, 0.17], [43, 4, 4, 0.17], [48, 8, 4, 0.17], [43, 12, 4, 0.17], [48, 16, 3, 0.17]];

  const TWINKLE = [
    [72, 0, 1], [72, 1, 1], [79, 2, 1], [79, 3, 1], [81, 4, 1], [81, 5, 1], [79, 6, 2],
    [77, 8, 1], [77, 9, 1], [76, 10, 1], [76, 11, 1], [74, 12, 1], [74, 13, 1], [72, 14, 3],
    [60, 0, 2, 0.2], [60, 4, 2, 0.2], [53, 8, 2, 0.2], [55, 12, 2, 0.2], [48, 14, 3, 0.2]];

  const FIFTH = [
    [67, 0, 0.5], [67, 0.5, 0.5], [67, 1, 0.5], [63, 1.5, 3], [55, 0, 0.5, 0.2], [55, 0.5, 0.5, 0.2], [55, 1, 0.5, 0.2], [51, 1.5, 3, 0.2],
    [65, 5, 0.5], [65, 5.5, 0.5], [65, 6, 0.5], [62, 6.5, 4], [53, 5, 0.5, 0.2], [53, 5.5, 0.5, 0.2], [53, 6, 0.5, 0.2], [50, 6.5, 4, 0.2]];

  // Gymnopédie No. 1: G-maj7 / D-maj7 accompaniment and melody
  const GYMNO = [];
  for (let i = 0; i < 6; i++) {
    const b = i * 3, g = i % 2 === 0;
    GYMNO.push([g ? 43 : 38, b, 3, 0.16]);
    (g ? [59, 62, 66] : [57, 62, 66]).forEach((n, k) => GYMNO.push([n, b + 1, 2, 0.06 - k * 0.005]));
  }
  GYMNO.push([78, 3, 3, 0.17], [81, 6, 2, 0.17], [79, 8, 1, 0.17], [78, 9, 3, 0.17], [73, 12, 2, 0.17], [71, 14, 1, 0.17], [73, 15, 2, 0.17], [74, 17, 4, 0.18]);

  // Pachelbel's Canon: two-beat bass and the first eight melody notes
  const CANON = [];
  [50, 45, 47, 42, 43, 38, 43, 45].forEach((n, i) => CANON.push([n, i * 2, 3.6, 0.16]));
  // sustained chords (D A Bm F#m G D G A) under the bass
  [[57, 62, 66], [57, 61, 64], [59, 62, 66], [57, 61, 66], [55, 59, 62], [57, 62, 66], [55, 59, 62], [57, 61, 64]]
    .forEach((c, i) => c.forEach((n) => CANON.push([n, i * 2, 3.8, 0.07])));
  [78, 76, 74, 73, 71, 69, 71, 73].forEach((n, i) => CANON.push([n, i * 2, 2, 0.17]));
  CANON.push([74, 16, 5, 0.18], [50, 16, 5, 0.16], [57, 16, 5, 0.07], [62, 16, 5, 0.07], [66, 16, 5, 0.07]);

  // Prelude in C (Bach): 8 notes per bar, repeated twice
  const PRELUDE = [];
  [[48, 52, 55, 60, 64], [48, 50, 57, 62, 65], [47, 50, 55, 62, 65], [48, 52, 55, 60, 64]].forEach((c, bar) => {
    const pat = [c[0], c[1], c[2], c[3], c[4], c[2], c[3], c[4]];
    for (let r = 0; r < 2; r++) pat.forEach((n, i) => PRELUDE.push([n, bar * 16 + r * 8 + i, 2, 0.17]));
  });
  PRELUDE.push([36, 64, 6, 0.2], [48, 64, 6, 0.15], [64, 64, 6, 0.15], [67, 64, 6, 0.12]);

  const seqNotes = (list) => { let t = 0; return list.map(([n, d]) => { const x = [n, t, d]; t += d; return x; }); };

  const MORNING = seqNotes([[76, 1], [73, 1], [71, 1], [69, 1], [71, 1], [73, 1], [76, 1], [73, 1], [71, 1], [69, 1], [71, 1], [73, 1],
    [78, 1], [75, 1], [73, 1], [71, 1], [73, 1], [75, 1], [78, 1], [75, 1], [73, 1], [71, 1], [73, 1], [75, 1], [76, 4]]);
  const MINUET = seqNotes([[74, 1], [67, 0.5], [69, 0.5], [71, 0.5], [72, 0.5], [74, 1], [67, 1], [67, 1],
    [76, 1], [72, 0.5], [74, 0.5], [76, 0.5], [78, 0.5], [79, 1], [67, 1], [67, 2]]);
  const TURCA = seqNotes([[71, 1], [69, 1], [68, 1], [69, 1], [72, 4], [74, 1], [72, 1], [71, 1], [72, 1], [76, 4],
    [77, 1], [76, 1], [75, 1], [76, 1], [83, 1], [81, 1], [80, 1], [81, 1], [83, 1], [81, 1], [80, 1], [81, 1], [84, 4]]);
  const GREENSLEEVES = seqNotes([[69, 1], [72, 2], [74, 1], [76, 1.5], [77, 0.5], [76, 1], [74, 2], [71, 1], [67, 1.5], [69, 0.5], [71, 1], [72, 2], [69, 1],
    [69, 1.5], [68, 0.5], [69, 1], [71, 2], [68, 1], [64, 3]]);
  const BRAHMS = seqNotes([[64, 1], [64, 1], [67, 2], [64, 1], [64, 1], [67, 2], [64, 1], [67, 1], [72, 1], [71, 2], [69, 1], [69, 1], [67, 3]]);
  const FRERE = seqNotes([[60, 1], [62, 1], [64, 1], [60, 1], [60, 1], [62, 1], [64, 1], [60, 1], [64, 1], [65, 1], [67, 2], [64, 1], [65, 1], [67, 2],
    [67, 0.5], [69, 0.5], [67, 0.5], [65, 0.5], [64, 1], [60, 1], [67, 0.5], [69, 0.5], [67, 0.5], [65, 0.5], [64, 1], [60, 1], [60, 1], [55, 1], [60, 2]]);

  // bass (and fifth) accompaniment for pieces that lack one: [MIDI note, start, duration]
  const addBass = (piece, line, g = 0.17) => { line.forEach(([n, b, d]) => piece.push([n, b, d, g], [n + 7, b, d, g * 0.45])); return piece; };
  addBass(PRELUDE, [[36, 0, 16], [36, 16, 16], [31, 32, 16], [36, 48, 16]], 0.18);
  addBass(MORNING, [[40, 0, 4], [47, 4, 4], [40, 8, 4], [47, 12, 4], [54, 16, 4], [47, 20, 4], [40, 24, 6]]);
  addBass(MINUET, [[43, 0, 3], [43, 3, 3], [48, 6, 3], [50, 9, 2], [43, 11, 3]]);
  addBass(TURCA, [[45, 0, 4], [52, 4, 4], [45, 8, 4], [52, 12, 4], [40, 16, 4], [47, 20, 4], [40, 24, 4], [45, 28, 4]], 0.15);
  addBass(GREENSLEEVES, [[45, 0, 3], [48, 3, 3], [43, 6, 3], [40, 9, 3], [45, 12, 3], [43, 15, 3], [45, 18, 3], [40, 21, 4]]);
  addBass(BRAHMS, [[48, 0, 4], [48, 4, 4], [43, 8, 4], [41, 12, 2], [43, 14, 1], [48, 15, 3]]);
  addBass(FRERE, [[48, 0, 4], [43, 4, 4], [48, 8, 4], [43, 12, 4], [48, 16, 4], [43, 20, 4], [48, 24, 4]]);

  // --- custom sound: stored in IndexedDB, local only ---
  const idbOp = (mode, fn) => new Promise((res, rej) => {
    const r = indexedDB.open('timer-sounds', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('custom');
    r.onerror = () => rej(r.error);
    r.onsuccess = () => {
      const tx = r.result.transaction('custom', mode);
      const rq = fn(tx.objectStore('custom'));
      tx.oncomplete = () => { r.result.close(); res(rq && rq.result); };
      tx.onerror = () => rej(tx.error);
    };
  });
  const decode = (data) => { init(); return ctx.decodeAudioData(data.slice(0)); };

  async function loadCustom() {
    try {
      const rec = await idbOp('readonly', (st) => st.get('track'));
      if (!rec) return null;
      custom = { name: rec.name, buffer: await decode(rec.data) };
      return custom.name;
    } catch (e) { custom = null; return null; }
  }
  async function setCustom(file) {
    if (file.size > CUSTOM_BYTES) throw new Error('size');
    const data = await file.arrayBuffer();
    let buffer;
    try { buffer = await decode(data); } catch (e) { throw new Error('format'); }
    const name = file.name.replace(/\.[^.]+$/, '');
    await idbOp('readwrite', (st) => st.put({ name, data }, 'track'));
    custom = { name, buffer };
    return name;
  }
  async function clearCustom() {
    stop();
    custom = null;
    try { await idbOp('readwrite', (st) => st.delete('track')); } catch (e) {}
  }
  // the first 30 s, with a final fade-out
  function playCustom(t) {
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    const len = Math.min(CUSTOM_MAX, custom.buffer.duration), fade = Math.min(CUSTOM_FADE, len);
    src.buffer = custom.buffer;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + 0.03);
    g.gain.setValueAtTime(1, t + len - fade);
    g.gain.linearRampToValueAtTime(0.0001, t + len);
    src.connect(g);
    g.connect(bus);
    src.start(t, 0, len);
    playEnd = Math.max(playEnd, t + len);
  }

  const list = [
    { id: 'bowl', name: 'Campana tibetana', play: (t) => tone(hz(N.G4), t, { dur: 5, gain: 0.3, partials: BOWL }) },
    { id: 'deep', name: 'Ciotola profonda', play: (t) => { tone(hz(57), t, { dur: 6, gain: 0.32, partials: BOWL }); tone(hz(64), t + 0.05, { dur: 5, gain: 0.12, partials: BOWL }); } },
    { id: 'marimba', name: 'Marimba', play: (t) => seq([N.C5, N.E5, N.G5], t, 0.22, { dur: 0.9, gain: 0.35, partials: MARIMBA }) },
    { id: 'kalimba', name: 'Kalimba', play: (t) => seq([N.G5, N.B5, N.D6, N.B5], t, 0.2, { dur: 1.3, gain: 0.3, partials: KALIMBA }) },
    { id: 'harp', name: 'Arpa', play: (t) => seq([N.C4, N.E4, N.G4, N.C5, N.E5], t, 0.12, { dur: 2, gain: 0.25, partials: HARP }) },
    { id: 'carillon', name: 'Carillon', play: (t) => seq([N.C6, N.E6, N.G6, N.C7], t, 0.28, { dur: 2, gain: 0.16, partials: GLOCK }) },
    { id: 'celesta', name: 'Celesta ninnananna', play: (t) => seq([N.G5, N.E5, N.C5], t, 0.4, { dur: 1.8, gain: 0.3, partials: CELESTA }) },
    { id: 'drops', name: "Gocce d'acqua", play: (t) => [0, 0.45, 0.8, 1.45].forEach((d, i) => tone(1000 + i * 120, t + d, { dur: 0.35, gain: 0.3, glide: { from: 1.8, time: 0.08 }, partials: [[1, 1, 1]] })) },
    { id: 'flute', name: 'Flauto', play: (t) => { tone(hz(N.A4), t, { dur: 2.2, gain: 0.22, attack: 0.18, vib: 0.004, partials: [[1, 1, 1], [2, 0.12, 1]] }); tone(hz(N.C5), t + 0.7, { dur: 2.4, gain: 0.2, attack: 0.18, vib: 0.004, partials: [[1, 1, 1], [2, 0.12, 1]] }); } },
    { id: 'vibes', name: 'Vibrafono', play: (t) => seq([N.F5, N.A5, N.C6], t, 0.33, { dur: 2.6, gain: 0.25, vib: 0.002, partials: VIBES }) },
    { id: 'glass', name: 'Cristallo', play: (t) => tone(hz(N.A5), t, { dur: 3.2, gain: 0.2, partials: GLASS }) },
    { id: 'chimes', name: 'Chime al vento', play: (t) => { const sc = [N.C6, N.D6, N.E6, N.G6, N.D5 + 12, N.A5]; let d = 0; for (let i = 0; i < 14; i++) { tone(hz(sc[Math.floor(Math.random() * sc.length)]), t + d, { dur: 2.2, gain: 0.14, partials: GLOCK }); d += 0.1 + Math.random() * 0.25; } } },
    { id: 'gong', name: 'Gong lieve', play: (t) => tone(110, t, { dur: 6.5, gain: 0.35, attack: 0.03, partials: GONG }) },
    { id: 'dingdong', name: 'Ding-dong', play: (t) => { tone(hz(N.E5), t, { dur: 2.2, gain: 0.28, partials: BOWL }); tone(hz(N.C5), t + 0.65, { dur: 3, gain: 0.28, partials: BOWL }); } },
    { id: 'piano', name: 'Piano dolce', play: (t) => seq([N.C5, N.G4, N.E5, N.G5], t, 0.3, { dur: 2.2, gain: 0.22, partials: PIANO }) },
    { id: 'bubble', name: 'Bolla', play: (t) => [0, 0.5].forEach((d, i) => tone(i ? 520 : 380, t + d, { dur: 0.22, gain: 0.3, glide: { from: 0.45, time: 0.12 }, partials: [[1, 1, 1], [2, 0.2, 0.6]] })) },
    { id: 'bird', name: 'Uccellino', play: (t) => [0, 0.16, 0.32, 0.75, 0.91].forEach((d, i) => tone(2300 + (i % 3) * 300, t + d, { dur: 0.13, gain: 0.14, attack: 0.01, glide: { from: 0.8, time: 0.08 }, partials: [[1, 1, 1]] })) },
    { id: 'dawn', name: 'Alba', play: (t) => { tone(hz(N.D5), t, { dur: 3, gain: 0.22, attack: 0.08, partials: [[1, 1, 1], [2, 0.18, 0.8]] }); tone(hz(N.A5), t + 0.5, { dur: 3.4, gain: 0.2, attack: 0.08, partials: [[1, 1, 1], [2, 0.18, 0.8]] }); } },
    { id: 'wood', name: 'Legno zen', play: (t) => [0, 0.55].forEach((d, i) => tone(hz(i ? 55 : 60) * 2, t + d, { dur: 0.7, gain: 0.4, attack: 0.002, partials: [[1, 1, 1], [2.4, 0.3, 0.25], [4.1, 0.12, 0.12]] })) },
    { id: 'clElise', name: 'Per Elisa (Beethoven)', play: melPiece(0.17, PIANO, FUR_ELISE) },
    { id: 'clOde', name: 'Inno alla gioia (Beethoven)', play: melPiece(0.3, VIBES, ODE_TO_JOY, 0.22) },
    { id: 'clGymno', name: 'Gymnopédie n.1 (Satie)', play: melPiece(0.4, PIANO, GYMNO) },
    { id: 'clCanon', name: 'Canone (Pachelbel)', play: melPiece(0.6, PIANO, CANON) },
    { id: 'clTwinkle', name: 'Ah! vous dirai-je, maman (Mozart)', play: melPiece(0.33, CELESTA, TWINKLE, 0.26) },
    { id: 'clFifth', name: 'Quinta sinfonia (Beethoven)', play: melPiece(0.5, PIANO, FIFTH, 0.3) },
    { id: 'clPrelude', name: 'Preludio in Do (Bach)', play: melPiece(0.17, PIANO, PRELUDE) },
    { id: 'clMorning', name: 'Il mattino (Grieg)', play: melPiece(0.4, [[1, 1, 1], [2, 0.12, 1]], MORNING, 0.24) },
    { id: 'clMinuet', name: 'Minuetto in Sol (Bach)', play: melPiece(0.3, HARP, MINUET, 0.24) },
    { id: 'clTurca', name: 'Marcia turca (Mozart)', play: melPiece(0.14, PIANO, TURCA, 0.22) },
    { id: 'clGreen', name: 'Greensleeves', play: melPiece(0.36, CELESTA, GREENSLEEVES, 0.26) },
    { id: 'clBrahms', name: 'Ninna nanna (Brahms)', play: melPiece(0.38, CELESTA, BRAHMS, 0.26) },
    { id: 'clFrere', name: 'Fra Martino', play: melPiece(0.3, VIBES, FRERE, 0.22) },
  ];

  // menu sections, in display order
  const GROUPS = ['classic', 'bells', 'instr', 'nature'];
  const GROUP_OF = {};
  const put = (g, ids) => ids.forEach((id) => { GROUP_OF[id] = g; });
  put('bells', ['bowl', 'deep', 'carillon', 'glass', 'chimes', 'gong', 'dingdong']);
  put('instr', ['marimba', 'kalimba', 'harp', 'celesta', 'flute', 'vibes', 'piano']);
  put('nature', ['drops', 'bubble', 'bird', 'dawn', 'wood']);
  put('classic', ['clElise', 'clOde', 'clGymno', 'clCanon', 'clTwinkle', 'clFifth', 'clPrelude', 'clMorning', 'clMinuet', 'clTurca', 'clGreen', 'clBrahms', 'clFrere']);

  return {
    get groups() { return custom ? ['mine', ...GROUPS] : GROUPS; },
    loadCustom, setCustom, clearCustom,
    get hasCustom() { return !!custom; },
    stop,
    get playing() { return !!current; },
    set onState(fn) { onState = fn; },
    get list() {
      const l = list.map(({ id, name }) => ({ id, name, group: GROUP_OF[id] }));
      return custom ? [{ id: 'custom', name: custom.name, group: 'mine' }, ...l] : l;
    },
    play(id, volume = 0.7) {
      init();
      stop();
      const isCustom = id === 'custom' && custom;
      bus = current = newBus(isCustom);
      master.gain.value = Math.max(0, Math.min(1, volume));
      playEnd = 0;
      if (isCustom) playCustom(ctx.currentTime + 0.03);
      else {
        const s = list.find((x) => x.id === id) || list[0];
        const t0 = ctx.currentTime + 0.03;
        s.play(t0);
        if (REPEAT.has(s.id)) s.play(t0 + 3.2);
      }
      notify(true);
      const mine = current;
      endTimer = setTimeout(() => { if (current === mine) { current = null; notify(false); } }, Math.max(0, (playEnd - ctx.currentTime) * 1000));
    },
  };
})();
