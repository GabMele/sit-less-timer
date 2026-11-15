// 20 suoni dolci sintetizzati con WebAudio (nessun file audio necessario)
const Sounds = (() => {
  let ctx, master, bus;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);

    // riverbero morbido generato da rumore decrescente
    const len = Math.floor(ctx.sampleRate * 2.4);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const conv = ctx.createConvolver();
    conv.buffer = buf;
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    conv.connect(wet);
    wet.connect(master);
    bus = ctx.createGain();
    bus.connect(master);
    bus.connect(conv);
  }

  const STRETCH = 2.2;   // allunga le code dei suoni
  const REPEAT = new Set(['drops', 'bubble', 'bird', 'wood', 'marimba', 'kalimba', 'celesta', 'piano', 'harp']);
  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  const N = { C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81, B5: 83, C6: 84, D6: 86, E6: 88, G6: 91, C7: 96 };

  // Nota: serie di parziali [rapporto, gain, moltiplicatore di durata]
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

  // --- brani con il timbro "Pad morbido": basso + accordi sostenuti + melodia ---
  // ogni battuta: bass = nota MIDI del basso, v = voci dell'accordo, m = melodia [nota, battito, durata in battiti]
  const PADP = [[1, 1, 1], [2, 0.2, 0.9]];
  const BASSP = [[1, 1, 1], [2, 0.6, 1], [3, 0.25, 1]];
  const PLUCK = [[1, 1, 1], [2, 0.3, 0.4]];
  const padPiece = (beat0, bars) => (t) => {
    const beat = beat0 * 0.6;   // brani più brevi
    const bar = beat * 4;
    bars.forEach((b, i) => {
      const t0 = t + i * bar, last = i === bars.length - 1;
      const len = last ? bar * 1.5 : bar + 0.8;
      tone(hz(b.bass), t0, { sustain: true, dur: len, gain: 0.22, attack: 1.3, rel: 1, partials: BASSP });
      b.v.forEach((n) => [-6, 6].forEach((dt) => tone(hz(n), t0, { sustain: true, dur: len, gain: 0.045, attack: 1.7, rel: 1.3, detune: dt, partials: PADP })));
      if (!last) {
        tone(hz(b.bass + 12), t0 + 2 * beat, { dur: 1.1, gain: 0.08, attack: 0.02, partials: PLUCK });
        tone(hz(b.bass + 19), t0 + 3 * beat, { dur: 0.9, gain: 0.05, attack: 0.02, partials: PLUCK });
      }
      b.m.forEach(([n, bt, l]) => [-5, 5].forEach((dt) => tone(hz(n), t0 + bt * beat, { sustain: true, dur: l * beat + 1, gain: 0.07, attack: 0.65, rel: 1, detune: dt, partials: PADP })));
    });
  };

  const RHODES = [[1, 1, 1], [2, 0.28, 0.5], [3, 0.08, 0.3]];
  const BELL = [[1, 1, 1], [2, 0.15, 0.6], [4, 0.28, 0.3]];

  // accordi di piano morbidi su basso sostenuto (ribattuti a metà battuta)
  const chordPiece = (bar, bars) => (t) => {
    bars.forEach((b, i) => {
      const t0 = t + i * bar, last = i === bars.length - 1;
      const len = last ? bar * 1.8 : bar + 0.6;
      tone(hz(b.bass), t0, { sustain: true, dur: len, gain: 0.2, attack: 1.0, rel: 1, partials: BASSP });
      b.v.forEach((n) => [-6, 6].forEach((dt) => tone(hz(n), t0, { sustain: true, dur: len, gain: 0.03, attack: 1.5, rel: 1.3, detune: dt, partials: PADP })));
      const hit = (tt, g) => [b.bass + 12, ...b.v].forEach((n, k) => tone(hz(n), tt + k * 0.025, { dur: 1.3, gain: g, attack: 0.02, partials: PIANO }));
      hit(t0, 0.085);
      if (!last) hit(t0 + bar / 2, 0.05);
    });
  };

  // arpeggi + melodia rada: pat = indici delle voci (-1 = basso un'ottava sopra), mel = [nota, posizione 0..1 nella battuta, durata s]
  const arpPiece = (bar, timbre, pat, bars) => (t) => {
    bars.forEach((b, i) => {
      const t0 = t + i * bar, last = i === bars.length - 1;
      const len = last ? bar * 1.8 : bar + 0.6;
      tone(hz(b.bass), t0, { sustain: true, dur: len, gain: 0.2, attack: 1.0, rel: 1, partials: BASSP });
      b.v.forEach((n) => [-6, 6].forEach((dt) => tone(hz(n), t0, { sustain: true, dur: len, gain: 0.028, attack: 1.5, rel: 1.3, detune: dt, partials: PADP })));
      const p = last ? pat.slice(0, 4) : pat, step = last ? bar / 3 : bar / pat.length;
      p.forEach((x, k) => tone(hz(x < 0 ? b.bass + 12 : b.v[x]), t0 + k * step, { dur: 1.0, gain: x < 0 ? 0.09 : 0.075, attack: 0.012, partials: timbre }));
      b.mel.forEach(([n, f, d]) => [-4, 4].forEach((dt) => tone(hz(n), t0 + f * bar, { sustain: true, dur: d, gain: 0.05, attack: 0.08, rel: d * 0.7, detune: dt, partials: BELL })));
    });
  };

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
    { id: 'pad', name: 'Pad morbido', play: (t) => [N.C4, N.E4, N.G4, N.B4].forEach((n, i) => tone(hz(n), t, { dur: 4.5, gain: 0.13, attack: 1.0, detune: i % 2 ? 6 : -6, partials: [[1, 1, 1], [2, 0.2, 0.9]] })) },
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
    { id: 'padA', name: 'Pad · Risveglio', play: padPiece(0.8, [
      { bass: 36, v: [55, 59, 64], m: [[76, 0, 2], [79, 2, 1], [81, 3, 1]] },
      { bass: 33, v: [55, 60, 64], m: [[79, 0, 1.5], [76, 1.5, 0.5], [72, 2, 2]] },
      { bass: 41, v: [57, 60, 64], m: [[72, 0, 1], [77, 1, 1.5], [76, 2.5, 0.5], [74, 3, 1]] },
      { bass: 43, v: [55, 60, 62], m: [[74, 0, 2], [72, 2, 1], [71, 3, 1]] },
      { bass: 36, v: [55, 60, 64], m: [[76, 0, 4]] }]) },
    { id: 'padB', name: 'Pad · Lago', play: padPiece(0.95, [
      { bass: 33, v: [55, 60, 64], m: [[72, 1, 2], [76, 3, 1]] },
      { bass: 41, v: [57, 60, 64], m: [[77, 0, 3], [76, 3, 1]] },
      { bass: 36, v: [55, 59, 64], m: [[79, 0.5, 1.5], [76, 2, 1], [72, 3, 1]] },
      { bass: 40, v: [55, 59, 62], m: [[71, 0, 2], [74, 2, 1], [76, 3, 1]] },
      { bass: 33, v: [57, 60, 64], m: [[81, 0, 1.5], [76, 1.5, 2.5]] }]) },
    { id: 'padC', name: 'Pad · Nuvole', play: padPiece(0.85, [
      { bass: 41, v: [57, 60, 64], m: [[81, 0, 1], [84, 1, 2], [81, 3, 1]] },
      { bass: 43, v: [59, 62, 64], m: [[79, 0, 2], [83, 2, 1], [81, 3, 1]] },
      { bass: 40, v: [55, 59, 62], m: [[79, 0, 1.5], [74, 1.5, 0.5], [76, 2, 2]] },
      { bass: 38, v: [57, 60, 64], m: [[77, 0, 2], [76, 2, 1], [74, 3, 1]] },
      { bass: 41, v: [57, 60, 65], m: [[72, 0, 4]] }]) },
    { id: 'padD', name: 'Pad · Radura', play: padPiece(0.75, [
      { bass: 43, v: [59, 62, 67], m: [[74, 0, 1], [79, 1, 2], [78, 3, 1]] },
      { bass: 42, v: [57, 62, 66], m: [[81, 0, 2], [79, 2, 1], [78, 3, 1]] },
      { bass: 40, v: [59, 62, 67], m: [[79, 0, 1.5], [76, 1.5, 1.5], [74, 3, 1]] },
      { bass: 36, v: [59, 64, 67], m: [[72, 0, 1], [76, 1, 1], [79, 2, 2]] },
      { bass: 38, v: [57, 62, 67], m: [[81, 0, 2], [79, 2, 1], [78, 3, 1]] },
      { bass: 43, v: [59, 62, 67], m: [[79, 0, 4]] }]) },
    { id: 'padE', name: 'Pad · Sera', play: padPiece(1.0, [
      { bass: 38, v: [57, 60, 64], m: [[77, 0, 2], [76, 2, 1], [74, 3, 1]] },
      { bass: 34, v: [57, 62, 65], m: [[74, 0, 1.5], [77, 1.5, 0.5], [81, 2, 2]] },
      { bass: 43, v: [58, 62, 65], m: [[79, 0, 2], [77, 2, 1], [74, 3, 1]] },
      { bass: 33, v: [55, 62, 64], m: [[76, 0, 1], [79, 1, 1], [81, 2, 2]] },
      { bass: 38, v: [57, 60, 65], m: [[77, 0, 4]] }]) },
    { id: 'padF', name: 'Pad · Bianche (Fm D♭ A♭ E♭)', play: chordPiece(2.4, [
      { bass: 41, v: [56, 60, 65] },
      { bass: 37, v: [56, 61, 65] },
      { bass: 44, v: [60, 63, 68] },
      { bass: 39, v: [58, 63, 67] },
      { bass: 41, v: [56, 60, 65] }]) },
    { id: 'pnoA', name: 'Piano · Brezza', play: arpPiece(2.2, PIANO, [-1, 0, 2, 3, 2, 1, 3, 2], [
      { bass: 38, v: [57, 62, 64, 66], mel: [[74, 0, 1.6], [76, 0.5, 1.2]] },
      { bass: 47, v: [59, 62, 66, 69], mel: [[78, 0.25, 1.4]] },
      { bass: 43, v: [59, 62, 66, 67], mel: [[79, 0, 1.0], [78, 0.5, 1.2]] },
      { bass: 45, v: [57, 62, 64, 66], mel: [[76, 0, 1.0], [73, 0.55, 1.6]] },
      { bass: 38, v: [57, 62, 66, 69], mel: [[74, 0, 3]] }]) },
    { id: 'pnoB', name: 'Piano · Pioggia', play: arpPiece(2.2, RHODES, [-1, 1, 2, 1, 3, 2, 1, 2], [
      { bass: 45, v: [55, 60, 64, 71], mel: [[76, 0.1, 1.8]] },
      { bass: 41, v: [57, 60, 64, 69], mel: [[72, 0, 1.0], [77, 0.5, 1.4]] },
      { bass: 40, v: [55, 59, 64, 67], mel: [[76, 0, 1.0], [79, 0.5, 1.4]] },
      { bass: 43, v: [59, 62, 64, 69], mel: [[74, 0, 1.0], [71, 0.6, 1.4]] },
      { bass: 45, v: [57, 60, 64, 69], mel: [[69, 0, 3]] }]) },
    { id: 'pnoC', name: 'Piano · Alba chiara', play: arpPiece(2.2, PIANO, [-1, 0, 1, 2, 3, 2, 3, 1], [
      { bass: 36, v: [55, 59, 62, 64], mel: [[79, 0, 1.5], [83, 0.5, 1.3]] },
      { bass: 40, v: [55, 59, 62, 66], mel: [[81, 0.2, 1.6]] },
      { bass: 41, v: [57, 60, 64, 71], mel: [[84, 0, 1.4], [81, 0.55, 1.4]] },
      { bass: 43, v: [57, 62, 64, 67], mel: [[79, 0, 1.0], [74, 0.5, 1.5]] },
      { bass: 36, v: [55, 60, 64, 67], mel: [[79, 0, 3.2]] }]) },
    { id: 'pnoD', name: 'Piano · Sera blu', play: arpPiece(2.2, RHODES, [-1, 1, 3, 2, 1, 3, 2, 1], [
      { bass: 36, v: [58, 63, 67, 74], mel: [[75, 0, 1.5], [74, 0.55, 1.2]] },
      { bass: 44, v: [55, 60, 63, 67], mel: [[72, 0.2, 1.6]] },
      { bass: 41, v: [56, 60, 63, 67], mel: [[72, 0, 1.0], [68, 0.5, 1.5]] },
      { bass: 43, v: [60, 62, 65, 67], mel: [[70, 0, 1.2], [67, 0.55, 1.4]] },
      { bass: 36, v: [55, 60, 63, 67], mel: [[75, 0, 3.2]] }]) },
    { id: 'pnoE', name: 'Piano · Sentiero', play: arpPiece(2.2, PIANO, [-1, 0, 1, 2, 3, 1, 2, 3], [
      { bass: 43, v: [59, 62, 67, 69], mel: [[74, 0, 1.2], [79, 0.5, 1.4]] },
      { bass: 42, v: [57, 62, 66, 69], mel: [[78, 0.25, 1.6]] },
      { bass: 40, v: [59, 62, 67, 71], mel: [[76, 0, 1.2], [74, 0.55, 1.3]] },
      { bass: 36, v: [55, 62, 64, 67], mel: [[72, 0, 1.0], [79, 0.5, 1.6]] },
      { bass: 43, v: [59, 62, 67, 74], mel: [[74, 0, 3.2]] }]) },
  ];

  return {
    list: list.map(({ id, name }) => ({ id, name })),
    play(id, volume = 0.7) {
      init();
      master.gain.value = Math.max(0, Math.min(1, volume));
      const s = list.find((x) => x.id === id) || list[0];
      const t0 = ctx.currentTime + 0.03;
      s.play(t0);
      if (REPEAT.has(s.id)) s.play(t0 + 3.2);
    },
  };
})();
