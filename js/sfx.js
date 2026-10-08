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

  const SYNTH = {
    tick: () => tone(1100, 0, 0.035, 'square', 0.04),
    flip: () => noise(0, 0.09, 0.25, 2500),
    drum: () => { for (let i = 0; i < 14; i++) noise(i * 0.045, 0.04, 0.18 + i * 0.012, 900); },
    stamp: () => { tone(160, 0, 0.18, 'sine', 0.35, 50); noise(0, 0.08, 0.3, 600); },
    sad: () => {
      [392, 370, 349].forEach((f, i) => tone(f, i * 0.28, 0.26, 'sawtooth', 0.06));
      tone(330, 0.84, 0.7, 'sawtooth', 0.06, 300);
    },
    howl: () => {
      const c = ac(); if (!c) return;
      const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      o.type = 'sawtooth'; lfo.frequency.value = 7; lg.gain.value = 18;
      lfo.connect(lg).connect(o.frequency);
      const t = c.currentTime;
      o.frequency.setValueAtTime(300, t);
      o.frequency.exponentialRampToValueAtTime(820, t + 0.45);
      o.frequency.exponentialRampToValueAtTime(260, t + 1.4);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      o.connect(g).connect(c.destination);
      o.start(t); lfo.start(t); o.stop(t + 1.55); lfo.stop(t + 1.55);
    },
    heartbeat: () => { tone(70, 0, 0.14, 'sine', 0.5, 45); tone(65, 0.2, 0.16, 'sine', 0.4, 40); },
    boom: () => { tone(110, 0, 0.9, 'sine', 0.5, 30); noise(0, 0.6, 0.35, 300); },
    crown: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.07, 0.18, 'triangle', 0.12)),
    win: () => {
      [[523, 0, 0.12], [523, 0.13, 0.12], [523, 0.26, 0.12], [698, 0.4, 0.5], [880, 0.55, 0.6], [1046, 0.75, 0.9]]
        .forEach(([f, s, d]) => tone(f, s, d, 'square', 0.07));
      noise(0.4, 0.5, 0.12, 5000);
    }
  };

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
      if (SYNTH[name]) SYNTH[name]();
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
