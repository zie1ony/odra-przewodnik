// Wspólna logika przewodnika — niezależna od warstwy wizualnej.
// Widok przekazuje callbacki: render(), gps(text), time(cur,dur,pct).
const GUIDE = (function () {
  const audio = document.getElementById('audio');
  let view = null;

  const state = {
    lang: CONFIG.languages[0].code,
    autoMode: false,
    queue: [],
    currentStageId: null,
    paused: false,
    pos: null,            // {lat,lng,acc}
    entered: new Set()    // etapy, w których obrębie aktualnie jesteśmy (anty-powtórka)
  };

  // ---- geo ----
  function haversine(a, b) {
    const R = 6371000, toR = Math.PI / 180;
    const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
    const la1 = a.lat * toR, la2 = b.lat * toR;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function distM(stage) {
    if (!state.pos) return null;
    return haversine(state.pos, stage.coordinates);
  }

  // ---- helpers ----
  function fileFor(stageId) {
    const lang = CONFIG.languages.find(l => l.code === state.lang);
    const f = lang && lang.files.find(x => x.stageId === stageId);
    return f ? CONFIG.mp3_directory + '/' + lang.code + '/' + f.fileName : null;
  }
  function stageName(id) {
    const s = CONFIG.stages.find(x => x.id === id);
    return s ? s.description : '—';
  }
  function fmt(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  // ---- playback ----
  function load(stageId, autoTriggered) {
    const src = fileFor(stageId);
    if (!src) return;
    state.currentStageId = stageId;
    state.paused = false;
    audio.src = src;
    const p = audio.play();
    if (p && p.catch) p.catch(() => { state.paused = true; refresh(); });
    refresh();
  }

  // odtwarzanie automatyczne (z GPS) — NIE wyłącza trybu auto
  function autoPlay(stageId) { load(stageId, true); }

  // odtwarzanie ręczne — wyłącza tryb auto i czyści kolejkę
  function playManual(stageId) {
    state.autoMode = false;
    state.queue = [];
    load(stageId, false);
  }

  function stop() {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    state.currentStageId = null;
    state.paused = false;
    refresh();
  }
  function togglePlay() {
    if (!state.currentStageId) return;
    if (audio.paused) { audio.play(); state.paused = false; }
    else { audio.pause(); state.paused = true; }
    refresh();
  }
  function next() {
    const idx = CONFIG.stages.findIndex(s => s.id === state.currentStageId);
    const nextStage = CONFIG.stages[idx + 1] || CONFIG.stages[0];
    playManual(nextStage.id); // ">|" to akcja ręczna
  }
  function seekTo(pct) {
    if (audio.duration) audio.currentTime = (pct / 100) * audio.duration;
  }

  // gdy utwór się skończy — pobierz z kolejki
  audio.addEventListener('ended', () => {
    if (state.queue.length) { autoPlay(state.queue.shift()); }
    else { state.currentStageId = null; refresh(); }
  });
  audio.addEventListener('timeupdate', () => {
    if (!view || !view.time) return;
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    view.time(fmt(audio.currentTime), fmt(audio.duration), pct);
  });

  // ---- tryb auto / GPS ----
  function setAuto(on) {
    state.autoMode = on;
    if (on) { state.entered = new Set(); evaluate(); }
    else { state.queue = []; }
    refresh();
  }

  function evaluate() {
    if (!state.autoMode || !state.pos) return;
    CONFIG.stages.forEach(s => {
      const d = distM(s);
      if (d == null) return;
      const inside = d <= CONFIG.accuracy_meters;
      if (!inside) { state.entered.delete(s.id); return; }
      if (state.entered.has(s.id)) return;   // już obsłużony, nie powtarzaj
      state.entered.add(s.id);
      if (!state.currentStageId) autoPlay(s.id);
      else if (s.id !== state.currentStageId && !state.queue.includes(s.id))
        state.queue.push(s.id);              // zakolejkuj
    });
  }

  function startGeo() {
    if (!navigator.geolocation) { gpsText('brak GPS w przeglądarce'); return; }
    navigator.geolocation.watchPosition(
      p => {
        state.pos = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy };
        gpsText(state.pos.lat.toFixed(5) + ', ' + state.pos.lng.toFixed(5) + ' (±' + Math.round(state.pos.acc) + ' m)');
        evaluate();
        refresh();
      },
      () => gpsText('brak dostępu do lokalizacji'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }

  // ---- view glue ----
  function refresh() { if (view && view.render) view.render(); }
  function gpsText(t) { if (view && view.gps) view.gps(t); }
  function setLang(code) {
    state.lang = code;
    // zmiana języka w locie: jeśli coś gra, podmień plik zachowując pozycję
    if (state.currentStageId) {
      const t = audio.currentTime, wasPaused = audio.paused;
      audio.src = fileFor(state.currentStageId);
      audio.addEventListener('loadedmetadata', function once() {
        audio.removeEventListener('loadedmetadata', once);
        try { audio.currentTime = t; } catch (e) {}
        if (!wasPaused) audio.play();
      });
    }
    refresh();
  }

  return {
    init(v) { view = v; startGeo(); refresh(); },
    get lang() { return state.lang; },
    get autoMode() { return state.autoMode; },
    get queue() { return state.queue; },
    get currentStageId() { return state.currentStageId; },
    get paused() { return state.paused; },
    setLang, setAuto, playManual, stop, togglePlay, next, seekTo,
    stageName,
    currentStageName() { return stageName(state.currentStageId); },
    distanceText(stage) {
      const d = distM(stage);
      if (d == null) return 'odległość: —';
      if (d < 1000) return 'odległość: ' + Math.round(d) + ' m';
      return 'odległość: ' + (d / 1000).toFixed(1) + ' km';
    }
  };
})();
