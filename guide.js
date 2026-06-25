// Wspólna logika przewodnika — odtwarzanie ręczne (bez GPS).
// Obsługuje dwa rodzaje materiału: etapy przewodnika (z językiem) oraz utwory muzyczne.
// Widok przekazuje callbacki: render(), time(cur,dur,pct), songProgress(file,pct).
const GUIDE = (function () {
  const audio = document.getElementById('audio');
  let view = null;

  const state = {
    lang: CONFIG.languages[0].code,
    // current: {kind:'stage', id, title} | {kind:'song', key, title} | null
    current: null,
    paused: false
  };

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
  function songKey(file) { return CONFIG.mp3_directory + '/songs/' + file; }
  function songURL(file) { return CONFIG.mp3_directory + '/songs/' + encodeURIComponent(file); }

  // ---- playback ----
  function startUrl(url) {
    state.paused = false;
    audio.src = url;
    const p = audio.play();
    if (p && p.catch) p.catch(() => { state.paused = true; refresh(); });
    refresh();
  }

  // Etap przewodnika — plik jest już w magazynie (pobrany przy starcie).
  async function play(stageId) {
    const path = fileFor(stageId);
    if (!path) return;
    const url = await STORE.getURL(path);
    if (!url) { refresh(); return; }
    state.current = { kind: 'stage', id: stageId, title: stageName(stageId) };
    startUrl(url);
  }

  // Utwór muzyczny — buforowany lokalnie przy pierwszym odtworzeniu.
  const loading = new Set();
  async function playSong(file, title) {
    const key = songKey(file);
    if (loading.has(key)) return; // już się buforuje — nie zaczynaj drugi raz
    let url = await STORE.getURL(key);
    if (!url) {
      loading.add(key);
      try {
        if (view && view.songProgress) view.songProgress(file, null); // start buforowania
        await STORE.fetchAndStore(key, songURL(file), (r, t) => {
          if (view && view.songProgress) view.songProgress(file, t ? Math.round(r / t * 100) : null);
        });
      } catch (e) {
        if (view && view.songProgress) view.songProgress(file, -1); // błąd
        return;
      } finally {
        loading.delete(key);
      }
      if (view && view.songProgress) view.songProgress(file, 100);
      url = await STORE.getURL(key);
    }
    state.current = { kind: 'song', key, title };
    startUrl(url);
  }

  function stop() {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    state.current = null;
    state.paused = false;
    refresh();
  }
  function togglePlay() {
    if (!state.current) return;
    if (audio.paused) { audio.play(); state.paused = false; }
    else { audio.pause(); state.paused = true; }
    refresh();
  }
  function next() {
    if (!state.current || state.current.kind !== 'stage') return;
    const idx = CONFIG.stages.findIndex(s => s.id === state.current.id);
    const nextStage = CONFIG.stages[idx + 1] || CONFIG.stages[0];
    play(nextStage.id);
  }
  function seekTo(pct) {
    if (isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = (pct / 100) * audio.duration;
    }
  }

  audio.addEventListener('ended', () => { state.current = null; refresh(); });
  audio.addEventListener('timeupdate', () => {
    if (!view || !view.time) return;
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    view.time(fmt(audio.currentTime), fmt(audio.duration), pct);
  });

  // ---- view glue ----
  function refresh() { if (view && view.render) view.render(); }
  async function setLang(code) {
    state.lang = code;
    // zmiana języka w locie dotyczy tylko etapów przewodnika
    if (state.current && state.current.kind === 'stage') {
      const t = audio.currentTime, wasPaused = audio.paused;
      const url = await STORE.getURL(fileFor(state.current.id));
      if (url) {
        audio.src = url;
        audio.addEventListener('loadedmetadata', function once() {
          audio.removeEventListener('loadedmetadata', once);
          try { audio.currentTime = t; } catch (e) {}
          if (!wasPaused) audio.play();
        });
      }
    }
    refresh();
  }

  return {
    init(v) { view = v; refresh(); },
    get lang() { return state.lang; },
    get current() { return state.current; },
    get currentStageId() {
      return state.current && state.current.kind === 'stage' ? state.current.id : null;
    },
    get currentSongKey() {
      return state.current && state.current.kind === 'song' ? state.current.key : null;
    },
    get paused() { return state.paused; },
    setLang, play, playSong, stop, togglePlay, next, seekTo, stageName,
    songKey,
    currentTitle() { return state.current ? state.current.title : '—'; }
  };
})();
