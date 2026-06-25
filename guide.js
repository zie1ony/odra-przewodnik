// Wspólna logika przewodnika — odtwarzanie ręczne (bez GPS).
// Widok przekazuje callbacki: render(), time(cur,dur,pct).
const GUIDE = (function () {
  const audio = document.getElementById('audio');
  let view = null;

  const state = {
    lang: CONFIG.languages[0].code,
    currentStageId: null,
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

  // ---- playback ----
  function play(stageId) {
    const src = fileFor(stageId);
    if (!src) return;
    state.currentStageId = stageId;
    state.paused = false;
    audio.src = src;
    const p = audio.play();
    if (p && p.catch) p.catch(() => { state.paused = true; refresh(); });
    refresh();
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
    play(nextStage.id);
  }
  function seekTo(pct) {
    if (isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = (pct / 100) * audio.duration;
    }
  }

  audio.addEventListener('ended', () => { state.currentStageId = null; refresh(); });
  audio.addEventListener('timeupdate', () => {
    if (!view || !view.time) return;
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    view.time(fmt(audio.currentTime), fmt(audio.duration), pct);
  });

  // ---- view glue ----
  function refresh() { if (view && view.render) view.render(); }
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
    init(v) { view = v; refresh(); },
    get lang() { return state.lang; },
    get currentStageId() { return state.currentStageId; },
    get paused() { return state.paused; },
    setLang, play, stop, togglePlay, next, seekTo, stageName,
    currentStageName() { return stageName(state.currentStageId); }
  };
})();
