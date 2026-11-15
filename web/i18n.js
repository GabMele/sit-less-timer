// Traduzioni: en, fr, es, it
const I18N = (() => {
  const LANGS = { en: 'English', fr: 'Français', es: 'Español', it: 'Italiano' };
  const LOCALE = { en: 'en-GB', fr: 'fr-FR', es: 'es-ES', it: 'it-IT' };

  const T = {
    it: {
      title_min: 'Riduci a icona', title_max: 'Ingrandisci / ripristina', title_close: 'Chiudi',
      other: 'Altro', title_other: 'Durata personalizzata (minuti)',
      mode: 'Visualizzazione', mode_up: 'Tempo trascorso (count-up)', mode_down: 'Tempo rimanente (countdown)', title_mode: 'Clicca per alternare trascorso / rimanente', remaining: 'rimanenti', beyond: 'oltre il tempo', spent: 'trascorsi {0}',
      theme: 'Tema', th_system: 'Sistema', th_light: 'Chiaro', th_dark: 'Scuro', accent: 'Colore', ac_teal: 'Turchese', ac_blue: 'Blu', ac_violet: 'Viola', ac_pink: 'Rosa', ac_orange: 'Arancio', ac_green: 'Verde',
      brand_title: "Realizzato da nextquo.com", cta: "Hai bisogno di un sito o di un'app?", coffee: 'Se vuoi offrirmi un caffè (2 €)',
      title_about: 'Informazioni', about_h: 'Informazioni', about_desc: 'Timer analogico per non stare troppo seduti: alza lo sguardo, muoviti, riparti.', about_by: 'Realizzato da',
      title_sum: 'Riepilogo', title_set: 'Impostazioni', title_dur: 'Durata in minuti',
      title_stop: 'Stop / azzera', title_go: 'Avvia / pausa (spazio)',
      set_h: 'Impostazioni', snd: 'Suono', play: 'Ascolta', stop: 'Ferma', custom: "Brano personale", custom_load: "Carica…", custom_remove: "Rimuovi brano", custom_hint: "Primi 30 secondi, con dissolvenza finale.", custom_err_size: "File troppo grande (max 10 MB).", custom_err_fmt: "Formato audio non supportato.", vol: 'Volume', reps: 'Ripetizioni',
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
      title_min: 'Minimize', title_max: 'Maximize / restore', title_close: 'Close',
      other: 'Custom', title_other: 'Custom duration (minutes)',
      mode: 'Display', mode_up: 'Elapsed time (count-up)', mode_down: 'Time left (countdown)', title_mode: 'Click to switch elapsed / remaining', remaining: 'remaining', beyond: 'past target', spent: '{0} elapsed',
      theme: 'Theme', th_system: 'System', th_light: 'Light', th_dark: 'Dark', accent: 'Color', ac_teal: 'Teal', ac_blue: 'Blue', ac_violet: 'Violet', ac_pink: 'Pink', ac_orange: 'Orange', ac_green: 'Green',
      brand_title: "Made by nextquo.com", cta: "Need a website or an app?", coffee: 'If you’d like to buy me a coffee (€2)',
      title_about: 'About', about_h: 'About', about_desc: 'An analog timer to keep you from sitting too long: look up, move, start again.', about_by: 'Made by',
      title_sum: 'Summary', title_set: 'Settings', title_dur: 'Duration in minutes',
      title_stop: 'Stop / reset', title_go: 'Start / pause (space)',
      set_h: 'Settings', snd: 'Sound', play: 'Listen', stop: 'Stop', custom: "Your own sound", custom_load: "Load…", custom_remove: "Remove sound", custom_hint: "First 30 seconds, with a fade-out.", custom_err_size: "File too large (max 10 MB).", custom_err_fmt: "Unsupported audio format.", vol: 'Volume', reps: 'Repetitions',
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
      title_min: 'Réduire', title_max: 'Agrandir / restaurer', title_close: 'Fermer',
      other: 'Autre', title_other: 'Durée personnalisée (minutes)',
      mode: 'Affichage', mode_up: 'Temps écoulé (count-up)', mode_down: 'Temps restant (compte à rebours)', title_mode: 'Cliquer pour alterner écoulé / restant', remaining: 'restant', beyond: 'dépassé', spent: '{0} écoulé',
      theme: 'Thème', th_system: 'Système', th_light: 'Clair', th_dark: 'Sombre', accent: 'Couleur', ac_teal: 'Turquoise', ac_blue: 'Bleu', ac_violet: 'Violet', ac_pink: 'Rose', ac_orange: 'Orange', ac_green: 'Vert',
      brand_title: "Réalisé par nextquo.com", cta: "Besoin d'un site ou d'une application ?", coffee: 'Si vous voulez m’offrir un café (2 €)',
      title_about: 'À propos', about_h: 'À propos', about_desc: 'Un minuteur analogique pour ne pas rester trop longtemps assis : levez les yeux, bougez, repartez.', about_by: 'Réalisé par',
      title_sum: 'Résumé', title_set: 'Réglages', title_dur: 'Durée en minutes',
      title_stop: 'Stop / remise à zéro', title_go: 'Démarrer / pause (espace)',
      set_h: 'Réglages', snd: 'Son', play: 'Écouter', stop: 'Arrêter', custom: "Votre propre son", custom_load: "Charger…", custom_remove: "Retirer le son", custom_hint: "30 premières secondes, avec fondu final.", custom_err_size: "Fichier trop volumineux (10 Mo max).", custom_err_fmt: "Format audio non pris en charge.", vol: 'Volume', reps: 'Répétitions',
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
      title_min: 'Minimizar', title_max: 'Maximizar / restaurar', title_close: 'Cerrar',
      other: 'Otro', title_other: 'Duración personalizada (minutos)',
      mode: 'Visualización', mode_up: 'Tiempo transcurrido (count-up)', mode_down: 'Tiempo restante (cuenta atrás)', title_mode: 'Clic para alternar transcurrido / restante', remaining: 'restante', beyond: 'pasado', spent: '{0} transcurrido',
      theme: 'Tema', th_system: 'Sistema', th_light: 'Claro', th_dark: 'Oscuro', accent: 'Color', ac_teal: 'Turquesa', ac_blue: 'Azul', ac_violet: 'Violeta', ac_pink: 'Rosa', ac_orange: 'Naranja', ac_green: 'Verde',
      brand_title: "Creado por nextquo.com", cta: "¿Necesitas un sitio web o una app?", coffee: 'Si quieres invitarme a un café (2 €)',
      title_about: 'Acerca de', about_h: 'Acerca de', about_desc: 'Un temporizador analógico para no pasar demasiado tiempo sentado: levanta la vista, muévete, vuelve a empezar.', about_by: 'Creado por',
      title_sum: 'Resumen', title_set: 'Ajustes', title_dur: 'Duración en minutos',
      title_stop: 'Detener / reiniciar', title_go: 'Iniciar / pausa (espacio)',
      set_h: 'Ajustes', snd: 'Sonido', play: 'Escuchar', stop: 'Detener', custom: "Tu propio sonido", custom_load: "Cargar…", custom_remove: "Quitar sonido", custom_hint: "Primeros 30 segundos, con fundido final.", custom_err_size: "Archivo demasiado grande (máx. 10 MB).", custom_err_fmt: "Formato de audio no compatible.", vol: 'Volumen', reps: 'Repeticiones',
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
    en: { bowl: 'Tibetan bowl', deep: 'Deep bowl', marimba: 'Marimba', kalimba: 'Kalimba', harp: 'Harp', carillon: 'Carillon', celesta: 'Celesta lullaby', drops: 'Water drops', flute: 'Flute', vibes: 'Vibraphone', glass: 'Crystal', chimes: 'Wind chimes', gong: 'Soft gong', dingdong: 'Ding-dong', piano: 'Gentle piano', bubble: 'Bubble', bird: 'Little bird', dawn: 'Dawn', wood: 'Zen wood',
      clElise: 'Für Elise (Beethoven)', clOde: 'Ode to Joy (Beethoven)', clGymno: 'Gymnopédie No. 1 (Satie)', clCanon: 'Canon (Pachelbel)', clTwinkle: 'Twinkle Twinkle (Mozart)', clFifth: 'Fifth Symphony (Beethoven)' },
      clPrelude: 'Prelude in C (Bach)', clMorning: 'Morning Mood (Grieg)', clMinuet: 'Minuet in G (Bach)', clTurca: 'Turkish March (Mozart)', clGreen: 'Greensleeves', clBrahms: "Brahms' Lullaby", clFrere: 'Frère Jacques',
    fr: { bowl: 'Bol tibétain', deep: 'Bol profond', marimba: 'Marimba', kalimba: 'Kalimba', harp: 'Harpe', carillon: 'Carillon', celesta: 'Célesta berceuse', drops: "Gouttes d'eau", flute: 'Flûte', vibes: 'Vibraphone', glass: 'Cristal', chimes: 'Carillon à vent', gong: 'Gong doux', dingdong: 'Ding-dong', piano: 'Piano doux', bubble: 'Bulle', bird: 'Oiselet', dawn: 'Aube', wood: 'Bois zen',
      clElise: 'Pour Élise (Beethoven)', clOde: 'Ode à la joie (Beethoven)', clGymno: 'Gymnopédie n°1 (Satie)', clCanon: 'Canon (Pachelbel)', clTwinkle: 'Ah ! vous dirai-je, maman (Mozart)', clFifth: 'Cinquième symphonie (Beethoven)' },
      clPrelude: 'Prélude en do (Bach)', clMorning: 'Le matin (Grieg)', clMinuet: 'Menuet en sol (Bach)', clTurca: 'Marche turque (Mozart)', clGreen: 'Greensleeves', clBrahms: 'Berceuse (Brahms)', clFrere: 'Frère Jacques',
    es: { bowl: 'Cuenco tibetano', deep: 'Cuenco profundo', marimba: 'Marimba', kalimba: 'Kalimba', harp: 'Arpa', carillon: 'Carillón', celesta: 'Celesta nana', drops: 'Gotas de agua', flute: 'Flauta', vibes: 'Vibráfono', glass: 'Cristal', chimes: 'Campanillas de viento', gong: 'Gong suave', dingdong: 'Ding-dong', piano: 'Piano suave', bubble: 'Burbuja', bird: 'Pajarito', dawn: 'Alba', wood: 'Madera zen',
      clElise: 'Para Elisa (Beethoven)', clOde: 'Oda a la alegría (Beethoven)', clGymno: 'Gymnopédie n.º 1 (Satie)', clCanon: 'Canon (Pachelbel)', clTwinkle: 'Ah! vous dirai-je, maman (Mozart)', clFifth: 'Quinta sinfonía (Beethoven)' },
      clPrelude: 'Preludio en do (Bach)', clMorning: 'La mañana (Grieg)', clMinuet: 'Minueto en sol (Bach)', clTurca: 'Marcha turca (Mozart)', clGreen: 'Greensleeves', clBrahms: 'Nana (Brahms)', clFrere: 'Fray Santiago',
  };

  // nomi delle sezioni del menu suoni
  const GROUPS = {
    it: { mine: 'Personale', bells: 'Campane e gong', instr: 'Strumenti', nature: 'Natura', classic: 'Classici' },
    en: { mine: 'Yours', bells: 'Bells & gongs', instr: 'Instruments', nature: 'Nature', classic: 'Classical' },
    fr: { mine: 'Personnel', bells: 'Cloches et gongs', instr: 'Instruments', nature: 'Nature', classic: 'Classiques' },
    es: { mine: 'Personal', bells: 'Campanas y gongs', instr: 'Instrumentos', nature: 'Naturaleza', classic: 'Clásicos' },
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
    groupName: (g) => (GROUPS[lang] || GROUPS.en)[g] || g,
    soundName: (id, fallback) => (NAMES[lang] && NAMES[lang][id]) || fallback,
  };
})();
