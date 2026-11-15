// Traduzioni: en, fr, es, it
const I18N = (() => {
  const LANGS = { en: 'English', fr: 'Français', es: 'Español', it: 'Italiano' };
  const LOCALE = { en: 'en-GB', fr: 'fr-FR', es: 'es-ES', it: 'it-IT' };

  const T = {
    it: {
      other: 'Altro', title_other: 'Durata personalizzata (minuti)',
      mode: 'Visualizzazione', mode_up: 'Tempo trascorso (count-up)', mode_down: 'Tempo rimanente (countdown)', title_mode: 'Clicca per alternare trascorso / rimanente', remaining: 'rimanenti', beyond: 'oltre il tempo', spent: 'trascorsi {0}',
      theme: 'Tema', th_system: 'Sistema', th_light: 'Chiaro', th_dark: 'Scuro', accent: 'Colore', ac_teal: 'Turchese', ac_blue: 'Blu', ac_violet: 'Viola', ac_pink: 'Rosa', ac_orange: 'Arancio', ac_green: 'Verde',
      brand_title: "Realizzato da nextquo.com", cta: "Hai bisogno di un sito o di un'app?",
      title_about: 'Informazioni', about_h: 'Informazioni', about_desc: 'Timer analogico per non stare troppo seduti: alza lo sguardo, muoviti, riparti.', about_by: 'Realizzato da',
      title_sum: 'Riepilogo', title_set: 'Impostazioni', title_dur: 'Durata in minuti',
      title_stop: 'Stop / azzera', title_go: 'Avvia / pausa (spazio)',
      set_h: 'Impostazioni', snd: 'Suono', play: 'Ascolta', vol: 'Volume', reps: 'Ripetizioni',
      every: 'Ogni (minuti)', presets: 'Durate predefinite', ontop: 'Sempre in primo piano', lang: 'Lingua',
      keep: 'Conserva statistiche', days: '{0} giorni', clear: 'Cancella cronologia', clear_q: 'Cancellare tutte le statistiche? Non si può annullare.',
      hint: 'Allo scadere il suono si ripete (ripetizioni × intervallo) finché non premi Stop. Il timer continua a contare oltre il tempo: un nuovo anello per ogni ora.',
      sum_h: 'Riepilogo di oggi', ready: 'pronto', paused: 'in pausa', elapsed: 'trascorsi',
      left: 'mancano {0}', over: 'oltre +{0} · {1}',
      today_none: 'Oggi: nessuna attività', today_fmt: 'Oggi {0} attivo · {1} pausa',
      tile_a: 'Tempo attivo', tile_p: 'In pausa', tile_max: 'Più lungo di fila', tile_n: 'Pause fatte',
      day: 'Giornata', empty: 'Nessuna attività registrata oggi. Avvia il timer!', last7: 'Ultimi 7 giorni',
      today: 'Oggi', act: 'attivo', brk: 'pausa',
      sum_hint: 'La pausa conta dal momento in cui fermi o metti in pausa il timer fino alla ripartenza (oltre 3 ore = assenza, non conteggiata).',
    },
    en: {
      other: 'Custom', title_other: 'Custom duration (minutes)',
      mode: 'Display', mode_up: 'Elapsed time (count-up)', mode_down: 'Time left (countdown)', title_mode: 'Click to switch elapsed / remaining', remaining: 'remaining', beyond: 'past target', spent: '{0} elapsed',
      theme: 'Theme', th_system: 'System', th_light: 'Light', th_dark: 'Dark', accent: 'Color', ac_teal: 'Teal', ac_blue: 'Blue', ac_violet: 'Violet', ac_pink: 'Pink', ac_orange: 'Orange', ac_green: 'Green',
      brand_title: "Made by nextquo.com", cta: "Need a website or an app?",
      title_about: 'About', about_h: 'About', about_desc: 'An analog timer to keep you from sitting too long: look up, move, start again.', about_by: 'Made by',
      title_sum: 'Summary', title_set: 'Settings', title_dur: 'Duration in minutes',
      title_stop: 'Stop / reset', title_go: 'Start / pause (space)',
      set_h: 'Settings', snd: 'Sound', play: 'Listen', vol: 'Volume', reps: 'Repetitions',
      every: 'Every (minutes)', presets: 'Preset durations', ontop: 'Always on top', lang: 'Language',
      keep: 'Keep statistics', days: '{0} days', clear: 'Clear history', clear_q: 'Delete all statistics? This cannot be undone.',
      hint: 'When time is up the sound repeats (repetitions × interval) until you press Stop. The timer keeps counting past the target: a new ring for every hour.',
      sum_h: "Today's summary", ready: 'ready', paused: 'paused', elapsed: 'elapsed',
      left: '{0} left', over: 'over +{0} · {1}',
      today_none: 'Today: no activity', today_fmt: 'Today {0} active · {1} break',
      tile_a: 'Active time', tile_p: 'On break', tile_max: 'Longest stretch', tile_n: 'Breaks taken',
      day: 'Day', empty: 'No activity recorded today. Start the timer!', last7: 'Last 7 days',
      today: 'Today', act: 'active', brk: 'break',
      sum_hint: 'A break counts from when you stop or pause the timer until you start again (over 3 hours = away, not counted).',
    },
    fr: {
      other: 'Autre', title_other: 'Durée personnalisée (minutes)',
      mode: 'Affichage', mode_up: 'Temps écoulé (count-up)', mode_down: 'Temps restant (compte à rebours)', title_mode: 'Cliquer pour alterner écoulé / restant', remaining: 'restant', beyond: 'dépassé', spent: '{0} écoulé',
      theme: 'Thème', th_system: 'Système', th_light: 'Clair', th_dark: 'Sombre', accent: 'Couleur', ac_teal: 'Turquoise', ac_blue: 'Bleu', ac_violet: 'Violet', ac_pink: 'Rose', ac_orange: 'Orange', ac_green: 'Vert',
      brand_title: "Réalisé par nextquo.com", cta: "Besoin d'un site ou d'une application ?",
      title_about: 'À propos', about_h: 'À propos', about_desc: 'Un minuteur analogique pour ne pas rester trop longtemps assis : levez les yeux, bougez, repartez.', about_by: 'Réalisé par',
      title_sum: 'Résumé', title_set: 'Réglages', title_dur: 'Durée en minutes',
      title_stop: 'Stop / remise à zéro', title_go: 'Démarrer / pause (espace)',
      set_h: 'Réglages', snd: 'Son', play: 'Écouter', vol: 'Volume', reps: 'Répétitions',
      every: 'Toutes les (minutes)', presets: 'Durées prédéfinies', ontop: 'Toujours au premier plan', lang: 'Langue',
      keep: 'Conserver les statistiques', days: '{0} jours', clear: "Effacer l'historique", clear_q: 'Supprimer toutes les statistiques ? Action irréversible.',
      hint: "Une fois le temps écoulé, le son se répète (répétitions × intervalle) jusqu'à ce que vous appuyiez sur Stop. Le minuteur continue de compter : un nouvel anneau par heure.",
      sum_h: "Résumé d'aujourd'hui", ready: 'prêt', paused: 'en pause', elapsed: 'écoulé',
      left: 'reste {0}', over: 'dépassé +{0} · {1}',
      today_none: "Aujourd'hui : aucune activité", today_fmt: "Aujourd'hui {0} actif · {1} pause",
      tile_a: 'Temps actif', tile_p: 'En pause', tile_max: "Plus longue période", tile_n: 'Pauses faites',
      day: 'Journée', empty: "Aucune activité enregistrée aujourd'hui. Lancez le minuteur !", last7: '7 derniers jours',
      today: "Aujourd'hui", act: 'actif', brk: 'pause',
      sum_hint: "La pause compte à partir de l'arrêt ou de la mise en pause du minuteur jusqu'à la reprise (plus de 3 h = absence, non comptée).",
    },
    es: {
      other: 'Otro', title_other: 'Duración personalizada (minutos)',
      mode: 'Visualización', mode_up: 'Tiempo transcurrido (count-up)', mode_down: 'Tiempo restante (cuenta atrás)', title_mode: 'Clic para alternar transcurrido / restante', remaining: 'restante', beyond: 'pasado', spent: '{0} transcurrido',
      theme: 'Tema', th_system: 'Sistema', th_light: 'Claro', th_dark: 'Oscuro', accent: 'Color', ac_teal: 'Turquesa', ac_blue: 'Azul', ac_violet: 'Violeta', ac_pink: 'Rosa', ac_orange: 'Naranja', ac_green: 'Verde',
      brand_title: "Creado por nextquo.com", cta: "¿Necesitas un sitio web o una app?",
      title_about: 'Acerca de', about_h: 'Acerca de', about_desc: 'Un temporizador analógico para no pasar demasiado tiempo sentado: levanta la vista, muévete, vuelve a empezar.', about_by: 'Creado por',
      title_sum: 'Resumen', title_set: 'Ajustes', title_dur: 'Duración en minutos',
      title_stop: 'Detener / reiniciar', title_go: 'Iniciar / pausa (espacio)',
      set_h: 'Ajustes', snd: 'Sonido', play: 'Escuchar', vol: 'Volumen', reps: 'Repeticiones',
      every: 'Cada (minutos)', presets: 'Duraciones predefinidas', ontop: 'Siempre visible', lang: 'Idioma',
      keep: 'Conservar estadísticas', days: '{0} días', clear: 'Borrar historial', clear_q: '¿Borrar todas las estadísticas? No se puede deshacer.',
      hint: 'Al terminar el tiempo el sonido se repite (repeticiones × intervalo) hasta que pulses Detener. El temporizador sigue contando: un anillo nuevo por cada hora.',
      sum_h: 'Resumen de hoy', ready: 'listo', paused: 'en pausa', elapsed: 'transcurrido',
      left: 'quedan {0}', over: 'pasado +{0} · {1}',
      today_none: 'Hoy: sin actividad', today_fmt: 'Hoy {0} activo · {1} pausa',
      tile_a: 'Tiempo activo', tile_p: 'En pausa', tile_max: 'Racha más larga', tile_n: 'Pausas hechas',
      day: 'Jornada', empty: 'Sin actividad registrada hoy. ¡Inicia el temporizador!', last7: 'Últimos 7 días',
      today: 'Hoy', act: 'activo', brk: 'pausa',
      sum_hint: 'La pausa cuenta desde que detienes o pausas el temporizador hasta que reanudas (más de 3 h = ausencia, no cuenta).',
    },
  };

  // nomi dei suoni (it = nome predefinito in sounds.js)
  const NAMES = {
    en: { bowl: 'Tibetan bowl', deep: 'Deep bowl', marimba: 'Marimba', kalimba: 'Kalimba', harp: 'Harp', carillon: 'Carillon', celesta: 'Celesta lullaby', drops: 'Water drops', flute: 'Flute', pad: 'Soft pad', vibes: 'Vibraphone', glass: 'Crystal', chimes: 'Wind chimes', gong: 'Soft gong', dingdong: 'Ding-dong', piano: 'Gentle piano', bubble: 'Bubble', bird: 'Little bird', dawn: 'Dawn', wood: 'Zen wood',
      padA: 'Pad · Awakening', padB: 'Pad · Lake', padC: 'Pad · Clouds', padD: 'Pad · Clearing', padE: 'Pad · Evening', padF: 'Pad · White (Fm D♭ A♭ E♭)',
      pnoA: 'Piano · Breeze', pnoB: 'Piano · Rain', pnoC: 'Piano · Bright dawn', pnoD: 'Piano · Blue evening', pnoE: 'Piano · Path' },
    fr: { bowl: 'Bol tibétain', deep: 'Bol profond', marimba: 'Marimba', kalimba: 'Kalimba', harp: 'Harpe', carillon: 'Carillon', celesta: 'Célesta berceuse', drops: "Gouttes d'eau", flute: 'Flûte', pad: 'Pad doux', vibes: 'Vibraphone', glass: 'Cristal', chimes: 'Carillon à vent', gong: 'Gong doux', dingdong: 'Ding-dong', piano: 'Piano doux', bubble: 'Bulle', bird: 'Oiselet', dawn: 'Aube', wood: 'Bois zen',
      padA: 'Pad · Éveil', padB: 'Pad · Lac', padC: 'Pad · Nuages', padD: 'Pad · Clairière', padE: 'Pad · Soir', padF: 'Pad · Blanc (Fa m Ré♭ La♭ Mi♭)',
      pnoA: 'Piano · Brise', pnoB: 'Piano · Pluie', pnoC: 'Piano · Aube claire', pnoD: 'Piano · Soir bleu', pnoE: 'Piano · Sentier' },
    es: { bowl: 'Cuenco tibetano', deep: 'Cuenco profundo', marimba: 'Marimba', kalimba: 'Kalimba', harp: 'Arpa', carillon: 'Carillón', celesta: 'Celesta nana', drops: 'Gotas de agua', flute: 'Flauta', pad: 'Pad suave', vibes: 'Vibráfono', glass: 'Cristal', chimes: 'Campanillas de viento', gong: 'Gong suave', dingdong: 'Ding-dong', piano: 'Piano suave', bubble: 'Burbuja', bird: 'Pajarito', dawn: 'Alba', wood: 'Madera zen',
      padA: 'Pad · Despertar', padB: 'Pad · Lago', padC: 'Pad · Nubes', padD: 'Pad · Claro', padE: 'Pad · Tarde', padF: 'Pad · Blanco (Fa m Re♭ La♭ Mi♭)',
      pnoA: 'Piano · Brisa', pnoB: 'Piano · Lluvia', pnoC: 'Piano · Amanecer', pnoD: 'Piano · Atardecer azul', pnoE: 'Piano · Sendero' },
  };

  let lang = 'en';
  const detect = () => {
    const l = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return LANGS[l] ? l : 'en';
  };
  const t = (k, ...a) => (T[lang][k] ?? T.en[k] ?? k).replace(/\{(\d+)\}/g, (_, i) => a[i]);

  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((e) => { e.textContent = t(e.dataset.i18n); });
    document.querySelectorAll('[data-i18n-title]').forEach((e) => { e.title = t(e.dataset.i18nTitle); });
  }

  return {
    LANGS,
    detect,
    t,
    apply,
    get lang() { return lang; },
    setLang(l) { lang = LANGS[l] ? l : 'en'; },
    locale: () => LOCALE[lang],
    soundName: (id, fallback) => (NAMES[lang] && NAMES[lang][id]) || fallback,
  };
})();
