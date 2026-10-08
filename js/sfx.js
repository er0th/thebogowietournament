/* TheBogowieTournament — dźwięki. Domyślnie syntezowane w przeglądarce;
   własne pliki podepniesz w config.js (SFX: { win: 'sfx/win.mp3', ... }). */
(function () {
  'use strict';
  const cfg = (window.BOGOWIE_CONFIG && window.BOGOWIE_CONFIG.SFX) || {};
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('bogowie:muted') === '1'; } catch (e) { /* brak storage */ }

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol, slideTo) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime + start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + start + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, c.currentTime + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.02);
  }

  function noise(start, dur, vol, freq) {
    const c = ac(); if (!c) return;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq || 1800; g.gain.value = vol || 0.2;
    s.connect(f).connect(g).connect(c.destination);
    s.start(c.currentTime + start);
  }

  // Każdy efekt ma 3 warianty; przy każdym odtworzeniu losujemy jeden.
  const SYNTH = {
    tick: [
      () => tone(1100, 0, 0.035, 'square', 0.04),
      () => tone(1500, 0, 0.03, 'triangle', 0.07),
      () => { tone(800, 0, 0.025, 'square', 0.035); tone(1600, 0.02, 0.02, 'sine', 0.03); }
    ],
    flip: [
      () => noise(0, 0.09, 0.25, 2500),
      () => { noise(0, 0.05, 0.2, 4000); tone(600, 0, 0.06, 'triangle', 0.05, 1200); },
      () => noise(0, 0.14, 0.18, 1400)
    ],
    drum: [
      () => { for (let i = 0; i < 14; i++) noise(i * 0.045, 0.04, 0.18 + i * 0.012, 900); },
      () => { for (let i = 0; i < 8; i++) { tone(90, i * 0.11, 0.1, 'sine', 0.25 + i * 0.03, 50); noise(i * 0.11, 0.04, 0.12, 700); } },
      () => { for (let i = 0; i < 18; i++) noise(i * 0.035, 0.03, 0.08 + i * 0.015, 2200); tone(70, 0.65, 0.4, 'sine', 0.5, 40); }
    ],
    stamp: [
      () => { tone(160, 0, 0.18, 'sine', 0.35, 50); noise(0, 0.08, 0.3, 600); },
      () => { tone(220, 0, 0.12, 'square', 0.12, 60); noise(0, 0.12, 0.35, 350); },
      () => { tone(120, 0, 0.25, 'triangle', 0.35, 40); noise(0.02, 0.05, 0.25, 1800); }
    ],
    sad: [
      () => { [392, 370, 349].forEach((f, i) => tone(f, i * 0.28, 0.26, 'sawtooth', 0.06)); tone(330, 0.84, 0.7, 'sawtooth', 0.06, 300); },
      () => { tone(440, 0, 0.9, 'sawtooth', 0.05, 180); tone(447, 0, 0.9, 'sawtooth', 0.04, 185); },
      () => { [523, 494, 466, 440].forEach((f, i) => tone(f, i * 0.2, 0.18, 'square', 0.04)); tone(220, 0.8, 0.6, 'triangle', 0.08, 110); }
    ],
    howl: [
      () => warble(300, 820, 260, 1.5, 7, 18),
      () => warble(500, 1100, 350, 1.2, 11, 30),
      () => warble(180, 420, 120, 1.8, 5, 12)
    ],
    heartbeat: [
      () => { tone(70, 0, 0.14, 'sine', 0.5, 45); tone(65, 0.2, 0.16, 'sine', 0.4, 40); },
      () => { tone(55, 0, 0.2, 'sine', 0.6, 35); noise(0, 0.05, 0.1, 200); tone(50, 0.24, 0.22, 'sine', 0.5, 30); },
      () => { tone(80, 0, 0.1, 'triangle', 0.45, 50); tone(75, 0.15, 0.12, 'triangle', 0.4, 45); }
    ],
    boom: [
      () => { tone(110, 0, 0.9, 'sine', 0.5, 30); noise(0, 0.6, 0.35, 300); },
      () => { tone(160, 0, 0.5, 'square', 0.15, 40); noise(0, 0.35, 0.45, 900); noise(0.05, 0.8, 0.2, 150); },
      () => { noise(0, 0.08, 0.5, 3000); tone(90, 0.02, 1.2, 'sine', 0.55, 25); noise(0.1, 1.0, 0.18, 220); }
    ],
    crown: [
      () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.07, 0.18, 'triangle', 0.12)),
      () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.05, 0.22, 'sine', 0.12)),
      () => { [392, 523, 659].forEach(f => tone(f, 0, 0.5, 'triangle', 0.08)); tone(1046, 0.15, 0.4, 'sine', 0.08); }
    ],
    win: [
      () => {
        [[523, 0, 0.12], [523, 0.13, 0.12], [523, 0.26, 0.12], [698, 0.4, 0.5], [880, 0.55, 0.6], [1046, 0.75, 0.9]]
          .forEach(([f, s, d]) => tone(f, s, d, 'square', 0.07));
        noise(0.4, 0.5, 0.12, 5000);
      },
      () => [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.09, 0.5, 'triangle', 0.09)),
      () => { [[440, 0], [554, 0.15], [659, 0.3], [880, 0.45]].forEach(([f, s]) => tone(f, s, 0.6, 'sawtooth', 0.05)); noise(0.45, 0.6, 0.1, 6000); }
    ]
  };

  function warble(f0, f1, f2, dur, rate, depth) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sawtooth'; lfo.frequency.value = rate; lg.gain.value = depth;
    lfo.connect(lg).connect(o.frequency);
    const t = c.currentTime;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.3);
    o.frequency.exponentialRampToValueAtTime(f2, t + dur * 0.93);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }

  const files = {};
  let voiceNow = null;
  const has = name => !!(cfg[name] && (!Array.isArray(cfg[name]) || cfg[name].length));
  function fileFor(name) {
    const v = cfg[name];
    return Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v;
  }
  function playFile(src, vol) {
    if (!files[src]) { files[src] = new Audio(src); files[src].preload = 'auto'; }
    const a = files[src].cloneNode();
    a.volume = vol == null ? 0.85 : vol;
    a.play().catch(() => {});
    return a;
  }
  function play(name) {
    if (muted) return null;
    try {
      if (has(name)) return playFile(fileFor(name));
      const v = SYNTH[name];
      if (v) v[Math.floor(Math.random() * v.length)]();
    } catch (e) { /* dźwięk to tylko bonus */ }
    return null;
  }
  // Kwestie głosowe: nowa ucisza poprzednią, żeby się nie nakładały.
  function voice(name) {
    if (muted || !has(name)) return false;
    try {
      if (voiceNow) { voiceNow.pause(); voiceNow = null; }
      voiceNow = playFile(fileFor(name), 0.95);
      return true;
    } catch (e) { return false; }
  }

  window.Bogowie = window.Bogowie || {};
  window.Bogowie.Sfx = {
    play,
    voice,
    has,
    isMuted: () => muted,
    toggle() {
      muted = !muted;
      try { localStorage.setItem('bogowie:muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
      if (!muted) ac();
      return muted;
    }
  };
})();
