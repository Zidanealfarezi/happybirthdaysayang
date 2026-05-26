/* =============================================================
   AUDIO SYSTEM — Cinematic Music Player
   ulangtahun website
   =============================================================
   Place music at:  music/song1.mp3
   Place covers at: assets/music-cover/song1.jpeg
   ============================================================= */

'use strict';

/* ─────────────────────────────────────────────
   1. PLAYLIST
   ───────────────────────────────────────────── */
const playlist = [
  {
    id:     'song1',
    title:  'Sampai Jadi Debu',
    artist: 'BANDA NEIRA',
    file:   'music/song1.mp3',
    cover:  'assets/images/foto (4).jpeg',
    volume: 0.75,
    loop:   true
  }
];

/* ─────────────────────────────────────────────
   2. AUDIO ENGINE (HTML5 Audio)
   ───────────────────────────────────────────── */
const AudioEngine = (() => {
  let audio        = null;
  let isPlaying    = false;
  let isUserPaused = false;
  let currentIdx   = 0;
  let unlocked     = false;

  function init() {
    if (audio) return;
    audio = new Audio();
    audio.preload = 'auto';
    audio.loop    = true;
    audio.volume  = 0.75;
    
    // Debugging listener to log any loading errors
    audio.addEventListener('error', () => {
      console.error('[AudioEngine] Failed to load audio file:', audio.src, audio.error);
    });
  }

  function loadTrack(idx) {
    const cfg = playlist[idx];
    if (!cfg) return;
    currentIdx = idx;
    audio.src    = cfg.file;
    audio.volume = cfg.volume || 0.75;
    audio.loop   = cfg.loop !== false;
    UI.syncTrackInfo(idx);
  }

  async function play() {
    try {
      await audio.play();
      isPlaying = true;
      isUserPaused = false;
      UI.sync(true, currentIdx);
    } catch(e) {
      console.warn('[AudioEngine] Play failed:', e.message);
    }
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    isUserPaused = true;
    UI.sync(false, currentIdx);
  }

  function toggle() {
    if (isPlaying) pause();
    else play();
  }

  function setVolume(v) {
    const c = Math.max(0, Math.min(1, v));
    if (audio) audio.volume = c;
  }

  function nextTrack() {
    loadTrack((currentIdx + 1) % playlist.length);
    if (isPlaying || !isUserPaused) play();
  }

  function prevTrack() {
    // If more than 3 seconds in, restart current track
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    loadTrack((currentIdx - 1 + playlist.length) % playlist.length);
    if (isPlaying || !isUserPaused) play();
  }

  function seekTo(pct) {
    if (!audio || !audio.duration) return;
    audio.currentTime = pct * audio.duration;
  }

  function getProgress() {
    if (!audio || !audio.duration) return { current: 0, duration: 0, pct: 0 };
    return {
      current:  audio.currentTime,
      duration: audio.duration,
      pct:      audio.currentTime / audio.duration
    };
  }

  async function unlock() {
    if (unlocked) return;
    init();
    unlocked = true;
    loadTrack(0);
    await play();
  }

  return {
    unlock, play, pause, toggle, nextTrack, prevTrack,
    setVolume, seekTo, getProgress,
    getState: () => ({ isPlaying, isUserPaused, currentIdx })
  };
})();


/* ─────────────────────────────────────────────
   3. PLAYER UI
   ───────────────────────────────────────────── */
const UI = (() => {
  let root, coverImg, coverBg, titleEl, artistEl;
  let playBtn, prevBtn, nextBtn;
  let progressTrack, progressFill, progressDot;
  let timeEl, durEl;
  let volSlider, volFill;
  let fallbackEl;
  let progressRaf;
  let isPanelOpen = false;
  let toggleBtn   = null;
  let isDragging  = false;

  const fmt = s => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  function build() {
    injectCSS();

    root = document.createElement('div');
    root.id = 'cp-root';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Music Player');

    root.innerHTML = `
      <!-- Ambient blurred bg from cover -->
      <div class="cp-bg-blur">
        <img class="cp-bg-img" src="" alt="" aria-hidden="true" />
      </div>

      <!-- Animated border gradient ring -->
      <div class="cp-border-ring" aria-hidden="true"></div>

      <!-- Cinematic shine sweep -->
      <div class="cp-shine" aria-hidden="true"></div>

      <!-- Inner card -->
      <div class="cp-card">

        <!-- Cover art -->
        <div class="cp-cover-wrap">
          <img class="cp-cover" src="" alt="Album cover" />
          <div class="cp-cover-overlay"></div>
        </div>

        <!-- Info + controls -->
        <div class="cp-body">

          <!-- Track info -->
          <div class="cp-info">
            <p class="cp-title">♪ Loading…</p>
            <p class="cp-artist"></p>
          </div>

          <!-- Progress bar -->
          <div class="cp-progress-wrap">
            <div class="cp-progress-track">
              <div class="cp-progress-fill"></div>
              <div class="cp-progress-dot"></div>
            </div>
            <div class="cp-times">
              <span class="cp-time-cur">0:00</span>
              <span class="cp-time-dur">0:00</span>
            </div>
          </div>

          <!-- Controls -->
          <div class="cp-controls">
            <button class="cp-btn cp-prev-btn" aria-label="Previous track">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6V6zm3.5 6 8.5 5V7L9.5 12z"/></svg>
            </button>
            <button class="cp-btn cp-play-btn" aria-label="Play or pause">
              <svg class="cp-icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z"/></svg>
              <svg class="cp-icon-pause cp-hidden" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button class="cp-btn cp-next-btn" aria-label="Next track">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>

        </div><!-- /cp-body -->
      </div><!-- /cp-card -->

      <!-- Close panel button -->
      <button class="cp-mini-btn" aria-label="Close player">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg>
      </button>

      <!-- Fallback tap notice -->
      <div class="cp-fallback cp-hidden">
        <span>♪ Tap to play music</span>
      </div>
    `;

    document.body.appendChild(root);

    /* Build floating toggle button */
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'cp-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Toggle music player');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.innerHTML = `
      <svg class="cp-toggle-icon cp-icon-note" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
      <svg class="cp-toggle-icon cp-icon-close" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    `;
    toggleBtn.addEventListener('click', () => {
      togglePanel();
      AudioEngine.unlock();
    });
    document.body.appendChild(toggleBtn);

    /* Cache elements */
    coverImg     = root.querySelector('.cp-cover');
    coverBg      = root.querySelector('.cp-bg-img');
    titleEl      = root.querySelector('.cp-title');
    artistEl     = root.querySelector('.cp-artist');
    playBtn      = root.querySelector('.cp-play-btn');
    prevBtn      = root.querySelector('.cp-prev-btn');
    nextBtn      = root.querySelector('.cp-next-btn');
    progressTrack= root.querySelector('.cp-progress-track');
    progressFill = root.querySelector('.cp-progress-fill');
    progressDot  = root.querySelector('.cp-progress-dot');
    timeEl       = root.querySelector('.cp-time-cur');
    durEl        = root.querySelector('.cp-time-dur');
    volSlider    = root.querySelector('.cp-vol-input');
    volFill      = root.querySelector('.cp-vol-fill');
    fallbackEl   = root.querySelector('.cp-fallback');

    /* Events */
    playBtn.addEventListener('click', () => AudioEngine.toggle());
    prevBtn.addEventListener('click', () => AudioEngine.prevTrack());
    nextBtn.addEventListener('click', () => AudioEngine.nextTrack());

    /* Progress bar click-to-seek */
    progressTrack.addEventListener('mousedown', handleSeekStart);
    progressTrack.addEventListener('touchstart', handleSeekStart, { passive: false });

    /* Close button */
    root.querySelector('.cp-mini-btn').addEventListener('click', e => {
      e.stopPropagation();
      closePanel();
    });

    startProgressLoop();
  }

  /* Seek handling */
  function handleSeekStart(e) {
    e.preventDefault();
    isDragging = true;
    doSeek(e);
    document.addEventListener('mousemove', doSeek);
    document.addEventListener('mouseup', handleSeekEnd);
    document.addEventListener('touchmove', doSeek, { passive: false });
    document.addEventListener('touchend', handleSeekEnd);
  }

  function doSeek(e) {
    if (!isDragging) return;
    const rect = progressTrack.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    AudioEngine.seekTo(pct);
  }

  function handleSeekEnd() {
    isDragging = false;
    document.removeEventListener('mousemove', doSeek);
    document.removeEventListener('mouseup', handleSeekEnd);
    document.removeEventListener('touchmove', doSeek);
    document.removeEventListener('touchend', handleSeekEnd);
  }

  /* Progress update loop */
  function startProgressLoop() {
    function tick() {
      progressRaf = requestAnimationFrame(tick);
      const { current, duration, pct } = AudioEngine.getProgress();
      const p = Math.min(pct * 100, 100);
      progressFill.style.width = p + '%';
      progressDot.style.left   = p + '%';
      if (timeEl) timeEl.textContent = fmt(current);
      if (durEl)  durEl.textContent  = fmt(duration);
    }
    tick();
  }

  /* Sync play/pause state */
  function sync(playing, idx) {
    playBtn.querySelector('.cp-icon-play').classList.toggle('cp-hidden', playing);
    playBtn.querySelector('.cp-icon-pause').classList.toggle('cp-hidden', !playing);
    root.classList.toggle('cp-playing', playing);
    if (toggleBtn) toggleBtn.classList.toggle('cp-is-playing', playing);
  }

  /* Sync track metadata */
  function syncTrackInfo(idx) {
    if (idx >= 0 && idx < playlist.length) {
      const t = playlist[idx];
      titleEl.textContent  = t.title  || 'Unknown';
      artistEl.textContent = t.artist || '';
      if (t.cover) {
        coverImg.src = t.cover;
        coverBg.src  = t.cover;
      }
    }
  }

  function showFallback() {
    fallbackEl.classList.remove('cp-hidden');
    fallbackEl.addEventListener('click', () => {
      AudioEngine.unlock();
      fallbackEl.classList.add('cp-hidden');
    }, { once: true });
  }

  /* Panel open/close */
  function openPanel() {
    isPanelOpen = true;
    root.classList.add('cp-visible');
    toggleBtn.classList.add('cp-panel-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
  }

  function closePanel() {
    isPanelOpen = false;
    root.classList.remove('cp-visible');
    toggleBtn.classList.remove('cp-panel-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  function togglePanel() {
    isPanelOpen ? closePanel() : openPanel();
  }

  /* ── Inject all CSS ── */
  function injectCSS() {
    const s = document.createElement('style');
    s.textContent = `
/* =========================================
   CINEMATIC MUSIC PLAYER
   ========================================= */

/* ── Floating music toggle button ── */
#cp-toggle-btn {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9999;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: rgba(20, 5, 15, 0.88);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  box-shadow:
    0 8px 32px rgba(0,0,0,0.6),
    0 0 0 1px rgba(212,175,110,0.18) inset,
    0 0 20px rgba(180,50,90,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.3s cubic-bezier(.23,1,.32,1),
    box-shadow 0.3s ease,
    background 0.3s ease;
  animation: cp-toggle-float 5s ease-in-out infinite;
  will-change: transform;
  user-select: none;
}

@keyframes cp-toggle-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-5px); }
}

#cp-toggle-btn:hover {
  background: rgba(40, 10, 25, 0.95);
  box-shadow:
    0 12px 40px rgba(0,0,0,0.7),
    0 0 0 1px rgba(212,175,110,0.3) inset,
    0 0 30px rgba(200,60,100,0.25);
  animation-play-state: paused;
}

#cp-toggle-btn:active { transform: scale(0.93); }

/* Pulsing ring when playing */
#cp-toggle-btn.cp-is-playing::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1.5px solid rgba(212,175,110,0.4);
  animation: cp-ring-pulse 2.5s ease-out infinite;
}
@keyframes cp-ring-pulse {
  0%   { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.45); opacity: 0; }
}

.cp-toggle-icon {
  width: 22px;
  height: 22px;
  color: rgba(212,175,110,0.9);
  transition: transform 0.35s cubic-bezier(.23,1,.32,1), opacity 0.2s ease;
  position: absolute;
}
.cp-toggle-icon.cp-icon-close { opacity: 0; transform: rotate(-90deg) scale(0.6); }

#cp-toggle-btn.cp-panel-open .cp-icon-note  { opacity: 0; transform: rotate(90deg) scale(0.6); }
#cp-toggle-btn.cp-panel-open .cp-icon-close { opacity: 1; transform: rotate(0deg) scale(1); }

/* ── Slide-up music panel ── */
#cp-root {
  position: fixed;
  bottom: 92px;
  right: 28px;
  z-index: 9998;
  width: 230px;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(4, 3, 10, 0.92);
  backdrop-filter: blur(28px) saturate(1.6);
  -webkit-backdrop-filter: blur(28px) saturate(1.6);
  box-shadow:
    0 24px 64px rgba(0,0,0,0.7),
    0 0 0 1px rgba(212,175,110,0.14) inset,
    0 0 40px rgba(120,20,60,0.12);
  opacity: 0;
  transform: translateY(20px) scale(0.96);
  pointer-events: none;
  transition:
    opacity 0.4s cubic-bezier(.23,1,.32,1),
    transform 0.4s cubic-bezier(.23,1,.32,1);
  user-select: none;
  transform-origin: bottom right;
}

#cp-root.cp-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

/* ── Ambient blurred bg ── */
.cp-bg-blur {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.8s ease;
  pointer-events: none;
  z-index: 0;
}
.cp-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(28px) saturate(1.4) brightness(0.28);
  transform: scale(1.15);
}
#cp-root.cp-playing .cp-bg-blur { opacity: 1; }

/* ── Animated border ring ── */
.cp-border-ring {
  position: absolute;
  inset: -1px;
  border-radius: 21px;
  padding: 1px;
  background: conic-gradient(
    from var(--cp-angle, 0deg),
    transparent 0%,
    rgba(212,175,110,0.55) 20%,
    rgba(200,80,130,0.75) 40%,
    rgba(212,175,110,0.45) 60%,
    transparent 80%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
  z-index: 1;
  animation: cp-ring-spin 4s linear infinite paused;
}
@property --cp-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@keyframes cp-ring-spin { to { --cp-angle: 360deg; } }
#cp-root.cp-playing .cp-border-ring { opacity: 1; animation-play-state: running; }

/* ── Shine sweep ── */
.cp-shine {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%);
  background-size: 200% 100%;
  animation: cp-shine-sweep 5s ease-in-out infinite 2s;
  pointer-events: none;
  z-index: 2;
}
@keyframes cp-shine-sweep {
  0%   { background-position: 200% 0; }
  50%  { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ── Card inner ── */
.cp-card {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 16px 16px;
  gap: 12px;
}

/* ── Cover ── */
.cp-cover-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,110,0.1) inset;
  flex-shrink: 0;
  background: rgba(212,175,110,0.06);
}
.cp-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.6s cubic-bezier(.23,1,.32,1), filter 0.4s ease;
}
#cp-root:hover .cp-cover { transform: scale(1.03); }
.cp-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(4,3,10,0.55) 0%, transparent 50%);
  pointer-events: none;
}

/* ── Body ── */
.cp-body { width: 100%; display: flex; flex-direction: column; gap: 10px; }

/* ── Track info ── */
.cp-info { text-align: center; }
.cp-title {
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 13px;
  font-weight: 600;
  font-style: italic;
  color: rgba(245,237,224,0.95);
  letter-spacing: 0.02em;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cp-artist {
  font-family: 'EB Garamond', serif;
  font-size: 10px;
  font-weight: 400;
  color: rgba(212,175,110,0.5);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 2px 0 0;
}

/* ── Progress ── */
.cp-progress-wrap { width: 100%; }
.cp-progress-track {
  position: relative;
  height: 3px;
  background: rgba(212,175,110,0.12);
  border-radius: 2px;
  overflow: visible;
  cursor: pointer;
}
.cp-progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, rgba(200,60,110,0.8), rgba(212,175,110,0.95));
  border-radius: 2px;
  transition: width 0.25s linear;
}
.cp-progress-dot {
  position: absolute;
  top: 50%;
  left: 0%;
  width: 9px; height: 9px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 6px rgba(212,175,110,0.8);
  transition: left 0.25s linear, transform 0.2s ease;
  pointer-events: none;
}
.cp-progress-track:hover .cp-progress-dot { transform: translate(-50%, -50%) scale(1.4); }
.cp-times {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-family: 'EB Garamond', monospace;
  font-size: 9px;
  font-weight: 400;
  color: rgba(212,175,110,0.38);
  letter-spacing: 0.04em;
}

/* ── Controls ── */
.cp-controls { display: flex; align-items: center; justify-content: center; gap: 12px; }
.cp-btn {
  background: none;
  border: none;
  color: rgba(212,175,110,0.7);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, background 0.2s, transform 0.18s cubic-bezier(.23,1,.32,1);
  padding: 0;
}
.cp-btn svg { display: block; }
.cp-prev-btn, .cp-next-btn { width: 32px; height: 32px; }
.cp-prev-btn svg, .cp-next-btn svg { width: 18px; height: 18px; }
.cp-play-btn {
  width: 44px; height: 44px;
  background: rgba(212,175,110,0.1);
  border: 1px solid rgba(212,175,110,0.2);
}
.cp-play-btn svg { width: 22px; height: 22px; }
.cp-btn:hover { color: #fff; transform: scale(1.12); background: rgba(212,175,110,0.1); }
.cp-btn:active { transform: scale(0.93); }
.cp-play-btn:hover { background: rgba(212,175,110,0.2); border-color: rgba(212,175,110,0.4); }

@keyframes cp-play-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(212,175,110,0.4); }
  70%  { box-shadow: 0 0 0 10px rgba(212,175,110,0); }
  100% { box-shadow: 0 0 0 0 rgba(212,175,110,0); }
}
#cp-root.cp-playing .cp-play-btn { animation: cp-play-pulse 2.2s ease-out infinite; }

/* ── Close button inside panel ── */
.cp-mini-btn {
  position: absolute;
  top: 8px; right: 8px;
  z-index: 10;
  background: rgba(212,175,110,0.07);
  border: 1px solid rgba(212,175,110,0.12);
  border-radius: 50%;
  width: 22px; height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(212,175,110,0.4);
  transition: color 0.2s, background 0.2s, transform 0.15s;
  padding: 0;
}
.cp-mini-btn svg { width: 12px; height: 12px; }
.cp-mini-btn:hover { color: #fff; background: rgba(212,175,110,0.18); transform: scale(1.1); }

/* ── Fallback ── */
.cp-fallback {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4,3,10,0.88);
  border-radius: inherit;
  cursor: pointer;
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 12px;
  color: rgba(212,175,110,0.8);
  letter-spacing: 0.05em;
  transition: opacity 0.3s ease;
}
.cp-hidden { display: none !important; }

@media (max-width: 600px) {
  #cp-toggle-btn { bottom: 16px; right: 16px; width: 46px; height: 46px; }
  #cp-root { bottom: 74px; right: 16px; width: 200px; border-radius: 16px; }
  .cp-title { font-size: 12px; }
  .cp-play-btn { width: 40px; height: 40px; }
  .cp-play-btn svg { width: 20px; height: 20px; }
}
    `;
    document.head.appendChild(s);
  }

  return { build, sync, syncTrackInfo, showFallback, openPanel, closePanel, togglePanel };
})();


/* ─────────────────────────────────────────────
   4. AUTOPLAY GATE
   ───────────────────────────────────────────── */
function setupAutoplayGate() {
  const EVS = ['click', 'touchstart', 'keydown', 'pointerdown'];
  let done = false;
  function go() {
    if (done) return;
    done = true;
    EVS.forEach(e => document.removeEventListener(e, go, true));
    AudioEngine.unlock();
  }
  EVS.forEach(e => document.addEventListener(e, go, { capture: true }));
}


/* ─────────────────────────────────────────────
   5. BOOT
   ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  UI.build();
  setupAutoplayGate();
});
