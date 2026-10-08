/* TheBogowieTournament — interfejs. */
(function () {
  'use strict';
  const B = window.Bogowie;
  const I = B.Icons;
  const S = B.Sfx;
  const cfg = window.BOGOWIE_CONFIG || {};
  const api = B.backend;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pickOne = arr => arr[B.randInt(arr.length)];

  const STAMPS = ['WYPIERDALAJ', 'NARA', 'WYPAD', 'NOPE', 'PA PA', 'DO PIACHU', 'PŁACZ', 'SKOWYT', 'AUUU', 'SPADAJ'];
  const SLOT = ['A', 'B', 'C'];

  // Głos combo (rasa+klasa), a jak go nie ma, to klasy.
  function comboVoice(race, cls) {
    return S.voice(`combo:${race}|${cls}`) || S.voice(`class:${cls}`);
  }
  const RAGE_FU = '<img class="rage" src="img/rage-fu.png" alt="">';
  const RAGE_SWEET = '<img class="rage sweet" src="img/rage-sweet.png" alt="">';

  const state = { entries: [], selectedDate: null, faction: 'Horde', randFaction: 'Horde', calDay: null, nick: null };
  try { state.nick = localStorage.getItem('bogowie:nick') || null; } catch (e) { /* ignore */ }
  const T = ms => ms;

  /* ---------- gracze ---------- */

  const PLAYERS = (cfg.PLAYERS || []).map(p => Object.assign({ aliases: [] }, p));
  function playerOf(nick) {
    const k = B.nickKey(nick);
    return PLAYERS.find(p => B.nickKey(p.nick) === k || p.aliases.some(a => B.nickKey(a) === k)) || null;
  }
  function knownNicks() {
    const seen = new Map();
    PLAYERS.forEach(p => seen.set(B.nickKey(p.nick), p.nick));
    state.entries.forEach(e => {
      const p = playerOf(e.nick);
      const k = B.nickKey(p ? p.nick : e.nick);
      if (!seen.has(k)) seen.set(k, e.nick);
    });
    return Array.from(seen.values());
  }
  const sameNick = (a, b) => {
    const pa = playerOf(a), pb = playerOf(b);
    return B.nickKey(pa ? pa.nick : a) === B.nickKey(pb ? pb.nick : b);
  };

  /* ---------- drobne klocki ---------- */

  const raceName = id => (B.RACE_BY_ID[id] ? B.RACE_BY_ID[id].name : id);

  function raceCard(id, extra) {
    return `<div class="card race ${extra || ''}" data-v="${esc(id)}"><div class="card-ico">${I.race(id)}</div><div class="card-name${raceName(id).length > 12 ? ' long' : ''}">${esc(raceName(id))}</div></div>`;
  }
  function classCard(cls, raceId, extra) {
    return `<div class="card cls ${extra || ''}" data-v="${esc(cls)}" style="--cc:${B.CLASS_COLORS[cls] || '#999'}"><div class="card-ico">${I.cls(cls)}</div><div class="card-name">${esc(cls)}</div>${raceId ? `<div class="card-sub">${esc(raceName(raceId))}</div>` : ''}</div>`;
  }
  function mysteryCard() {
    return `<div class="card mystery"><div class="card-ico">${I.mystery()}</div><div class="card-name">???</div></div>`;
  }
  function comboChip(raceId, cls) {
    return `<span class="combo-chip" style="--cc:${B.CLASS_COLORS[cls] || '#999'}"><span class="mini">${I.race(raceId)}</span><span class="mini">${I.cls(cls)}</span><span>${esc(B.comboLabel(raceId, cls))}</span></span>`;
  }
  function avatar(nick, size) {
    const s = size || 32;
    const p = playerOf(nick);
    if (p && p.photo) {
      return `<img class="avatar" src="${esc(p.photo)}" alt="" width="${s}" height="${s}" style="width:${s}px;height:${s}px" loading="lazy">`;
    }
    if (p && p.art) {
      return `<span class="avatar avatar-art" style="width:${s}px;height:${s}px">${I.art(p.art, p.nick)}</span>`;
    }
    let h = 0; for (const ch of String(nick || '?')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return `<span class="avatar avatar-txt" style="width:${s}px;height:${s}px;font-size:${Math.round(s * 0.45)}px;background:hsl(${h % 360} 55% 42%)">${esc((nick || '?').trim().charAt(0).toUpperCase())}</span>`;
  }
  function fmtDate(d, opts) {
    return new Intl.DateTimeFormat('pl-PL', Object.assign({ timeZone: 'UTC', day: 'numeric', month: 'long' }, opts || {}))
      .format(new Date(d + 'T12:00:00Z'));
  }
  function toast(msg, bad) {
    const t = document.createElement('div');
    t.className = 'toast' + (bad ? ' bad' : '');
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3800);
  }
  function confetti(root) {
    const colors = ['#f2c230', '#e0412f', '#3b6fe0', '#6aa84f', '#ff6fb5', '#fff'];
    const box = document.createElement('div');
    box.className = 'confetti';
    box.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 90; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.6) + 's';
      p.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(p);
    }
    root.appendChild(box);
    setTimeout(() => box.remove(), 4000);
  }
  // Wybuch: emoji rozlatują się z punktu (x, y w procentach kontenera).
  function kaboom(root, x, y, n) {
    const bits = ['💥', '🔥', '💩', '💀', '⚡', '🍺', '💥', '🔥'];
    const box = document.createElement('div');
    box.className = 'kaboom';
    box.setAttribute('aria-hidden', 'true');
    box.style.left = x + '%'; box.style.top = y + '%';
    box.innerHTML = '<span class="ring"></span>';
    for (let i = 0; i < (n || 16); i++) {
      const b = document.createElement('i');
      const ang = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 180;
      b.textContent = bits[i % bits.length];
      b.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      b.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      b.style.fontSize = (18 + Math.random() * 26) + 'px';
      b.style.animationDelay = (Math.random() * 0.08) + 's';
      box.appendChild(b);
    }
    root.appendChild(box);
    setTimeout(() => box.remove(), 1400);
  }
  function poopRain(root) {
    const box = document.createElement('div');
    box.className = 'rain';
    box.setAttribute('aria-hidden', 'true');
    const bits = ['💩', '💥', '🔥', '🍺', '👑', '💀'];
    for (let i = 0; i < 60; i++) {
      const b = document.createElement('i');
      b.textContent = bits[i % bits.length];
      b.style.left = Math.random() * 100 + '%';
      b.style.fontSize = (20 + Math.random() * 30) + 'px';
      b.style.animationDelay = (Math.random() * 1.6) + 's';
      b.style.animationDuration = (1.8 + Math.random() * 1.8) + 's';
      box.appendChild(b);
    }
    root.appendChild(box);
    setTimeout(() => box.remove(), 5500);
  }

  /* ---------- odsłanianie turnieju ---------- */

  function Reveal(container, result, opts) {
    opts = opts || {};
    const byClass = result.order === 'class';
    const S1 = byClass ? 'Klasa' : 'Rasa';
    const combos = B.combosOf(result);
    const rounds = [];
    result.stage1.forEach((r, i) => rounds.push({ stage: 1, i, kind: byClass ? 'class' : 'race', data: r, title: `Losowanie ${i + 1}/3 → ${S1} ${SLOT[i]}` }));
    result.stage2.forEach((r, i) => rounds.push({ stage: 2, i, kind: byClass ? 'race' : 'class', data: r, title: `Losowanie ${i + 1}/3 → Combo ${i + 1} (${byClass ? r.cls : raceName(r.race)})` }));
    // Przy 3 lub mniej kandydatach nie ma kogo wywalać, a przy 1 nie ma nawet wyboru.
    const beats = [], roundEnd = [];
    rounds.forEach((r, ri) => {
      (r.data.contenders.length > 3 ? ['show', 'cut', 'crown'] : ['show', 'crown']).forEach(phase => beats.push({ ri, phase }));
      roundEnd[ri] = beats.length;
    });
    const finalStart = beats.length;
    result.final.sequence.forEach((slot, k) => beats.push({ final: true, k }));
    const cardOf = (round, v, cls) => round.kind === 'race' ? raceCard(v, cls) : classCard(v, round.stage === 2 ? round.data.race : null, cls);
    const target = result.final.target || 4;

    let pos = 0, busy = false;
    if (opts.key) { try { pos = Math.min(beats.length, parseInt(localStorage.getItem(opts.key) || '0', 10) || 0); } catch (e) { /* ignore */ } }
    const save = () => { if (opts.key) { try { localStorage.setItem(opts.key, String(pos)); } catch (e) { /* ignore */ } } };

    container.innerHTML = `
      <div class="reveal">
        <div class="rv-main">
          <div class="rv-head"><span class="rv-stage"></span><h3 class="rv-title"></h3></div>
          <p class="rv-hype" aria-live="polite"></p>
          <div class="rv-area"></div>
          <div class="rv-controls">
            <button type="button" class="btn btn-big rv-next"></button>
          </div>
        </div>
        <aside class="rv-side" aria-label="Podsumowanie"></aside>
        <div class="flash" aria-hidden="true"></div>
      </div>`;
    const area = $('.rv-area', container), side = $('.rv-side', container);
    const nextBtn = $('.rv-next', container), hype = $('.rv-hype', container);
    const box = $('.reveal', container);

    const LINES = {
      show: ['Los tasuje karty i ma na ciebie wyjebane.', 'Ktoś tu zaraz zapłacze jak dziecko.', 'Pomódl się do RNG, i tak nie pomoże.', 'Nie patrz. Albo patrz, chuj z tym.', 'Czujesz ten zapach? To strach. Albo Tauren.'],
      cut: ['Kto pierwszy wypierdala?', 'Zaraz będzie skowyt.', 'Pakujcie manatki, frajerzy.', 'Ktoś dziś wraca do domu z płaczem.', 'Kurwa, kogo tu wyjebać…'],
      crown: ['BĘBNY…', 'Zaciśnij pośladki.', 'To jest TEN moment, kurwa.', 'Jeszcze… jeszcze…', 'Nogi się trzęsą jak po pięciu monsterach.'],
      final: ['Kręcimy, kurwa!', 'Ojojoj…', 'Kto to zgarnie?', 'Serce w gardle, dupa w trokach.', 'Nie mrugaj, bo przegapisz.']
    };
    const SHOUTS = ['BUM!', 'JEB!', 'ZUG ZUG!', 'PIERDUT!', 'KABOOM!', 'ŁUP!', 'SRU!', 'O KURWA!'];
    const DEATHS = ['SKOWYT.', 'PŁACZ I ZGRZYTANIE ZĘBAMI.', 'SPIERDALAJ.', 'DO PIACHU.', 'NARA, FRAJERZE.', 'AUUUU.', 'SPADAJ NA DRZEWO.'];
    const say = (txt, hot) => { hype.textContent = txt; hype.classList.toggle('hot', !!hot); hype.classList.remove('pop'); void hype.offsetWidth; hype.classList.add('pop'); };
    const quake = (strong) => { box.classList.remove('quake', 'quake-big'); void box.offsetWidth; box.classList.add(strong ? 'quake-big' : 'quake'); };
    const flash = () => { const f = $('.flash', box); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); };
    const kabooomAt = (el, n) => {
      if (!el) return;
      const bb = box.getBoundingClientRect(), eb = el.getBoundingClientRect();
      kaboom(box, ((eb.left + eb.width / 2 - bb.left) / bb.width) * 100, ((eb.top + eb.height / 2 - bb.top) / bb.height) * 100, n);
    };
    const shout = txt => {
      const s = document.createElement('div');
      s.className = 'shout';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = txt;
      s.style.setProperty('--rot', (B.randInt(24) - 12) + 'deg');
      box.appendChild(s);
      setTimeout(() => s.remove(), 1300);
    };

    function roundDone(ri) { return pos >= roundEnd[ri]; }
    function finalCounts(upto) {
      const c = [0, 0, 0];
      result.final.sequence.slice(0, upto).forEach(s => c[s]++);
      return c;
    }

    function renderSide() {
      const first = result.stage1.map((r, i) => roundDone(i)
        ? `<li><b>${S1} ${SLOT[i]}</b><span class="mini">${byClass ? I.cls(r.winner) : I.race(r.winner)}</span>${esc(byClass ? r.winner : raceName(r.winner))}</li>`
        : `<li class="empty"><b>${S1} ${SLOT[i]}</b>czeka…</li>`).join('');
      const combosHtml = combos.map((c, i) => roundDone(3 + i)
        ? `<li><b>Combo ${i + 1}</b>${comboChip(c.race, c.cls)}</li>`
        : `<li class="empty"><b>Combo ${i + 1}</b>czeka…</li>`).join('');
      side.innerHTML = `
        <div class="side-faction">${I.faction(result.faction)}<span>${esc(B.FACTION_PL[result.faction])}</span></div>
        <h4>Etap 1 · ${byClass ? 'Klasy' : 'Rasy'}</h4><ul class="slots">${first}</ul>
        <h4>Etap 2 · Combo</h4><ul class="slots">${combosHtml}</ul>
        <h4>Finał · Bo7</h4><p class="muted small">Pierwsze combo z ${target} trafieniami wygrywa.</p>`;
    }

    function cardsFor(round, phase) {
      const d = round.data;
      if (phase === 'none') return d.contenders.map(() => mysteryCard()).join('');
      return d.contenders.map(v => {
        let cls = '';
        const out = !d.advancing.includes(v);
        if ((phase === 'cut' || phase === 'crown') && out) cls += ' out';
        if (phase === 'crown') cls += v === d.winner ? ' crowned' : (out ? '' : ' dim');
        return cardOf(round, v, cls);
      }).join('');
    }

    function addStamps() {
      $$('.card', area).forEach(c => {
        if (c.classList.contains('out') && !$('.stamp', c)) c.insertAdjacentHTML('beforeend', `<span class="stamp">${pickOne(STAMPS)}</span>${RAGE_FU}`);
        if (c.classList.contains('crowned') && !$('.crown-tag', c)) c.insertAdjacentHTML('beforeend', `<span class="crown-tag">WYBRANIEC</span>${RAGE_SWEET}`);
      });
    }

    function renderRound(ri, phase) {
      const round = rounds[ri];
      $('.rv-stage', container).textContent = (round.kind === 'race' ? `ETAP ${round.stage} · RASY` : `ETAP ${round.stage} · KLASY`);
      $('.rv-title', container).textContent = round.title;
      area.innerHTML = `<div class="cards">${cardsFor(round, phase)}</div>`;
      addStamps();
    }

    function renderFinal(upto, highlight) {
      const c = finalCounts(upto);
      $('.rv-stage', container).textContent = 'FINAŁ · BO7';
      $('.rv-title', container).textContent = `Kto pierwszy trafi ${target} razy, ten wygrywa`;
      const cards = combos.map((r, i) => {
        const pips = Array.from({ length: target }, (_, p) => `<i class="${p < c[i] ? 'on' : ''}"></i>`).join('');
        const mp = c[i] === target - 1;
        return `<div class="fcard ${highlight === i ? 'hot' : ''} ${mp ? 'matchpoint' : ''}" data-slot="${i}" style="--cc:${B.CLASS_COLORS[r.cls]}">
          ${mp ? '<span class="mp-tag">MECZBOL</span>' : ''}
          <div class="fcard-tag">Combo ${i + 1}</div>
          <div class="fcard-icos">${I.race(r.race)}${I.cls(r.cls)}</div>
          <div class="fcard-name">${esc(B.comboLabel(r.race, r.cls))}</div>
          <div class="pips" aria-label="${c[i]} z ${target}">${pips}</div></div>`;
      }).join('');
      const log = result.final.sequence.slice(0, upto).map((s, k) => `<span class="logchip">${k + 1}. Combo ${s + 1}</span>`).join('');
      area.innerHTML = `<div class="fcards">${cards}</div><div class="flog">${log || '<span class="muted">Jeszcze nic. Kliknij i módl się.</span>'}</div>`;
    }

    function renderDone() {
      const w = B.winnerOf(result);
      const c = finalCounts(result.final.sequence.length);
      $('.rv-stage', container).textContent = 'MAMY ZWYCIĘZCĘ';
      $('.rv-title', container).textContent = 'Los przemówił. Reklamacji nie przyjmujemy.';
      hype.textContent = '';
      area.innerHTML = `
        <div class="winner">
          <img class="mind-blown" src="img/mind-blown.png" alt="Mind blown">
          <span class="gg">ZUG ZUG</span>
          <div class="winner-icos">${I.faction(result.faction)}${I.race(w.race)}${I.cls(w.cls)}</div>
          <div class="winner-name" style="--cc:${B.CLASS_COLORS[w.cls]}">${esc(B.comboLabel(w.race, w.cls))}</div>
          <p class="winner-meme">${esc(B.RACE_MEMES[w.race] || '')}<br>${esc(B.CLASS_MEMES[w.cls] || '')}</p>
          <p class="muted">Wynik finału: ${c.map((n, i) => `Combo ${i + 1}: ${n}`).join(' · ')}</p>
          <div class="winner-actions"></div>
        </div>`;
      if (opts.actions) opts.actions($('.winner-actions', area));
    }

    function renderAt() {
      renderSide();
      if (pos >= beats.length) { renderDone(); }
      else if (pos >= finalStart) { renderFinal(pos - finalStart); }
      else if (pos === 0) { renderRound(0, 'none'); }
      else {
        const last = beats[pos - 1];
        renderRound(last.ri, last.phase);
      }
      updateButtons();
    }

    function updateButtons() {
      const done = pos >= beats.length;
      nextBtn.hidden = done;
      nextBtn.disabled = busy;
      if (done) return;
      const b = beats[pos];
      let label;
      if (b.final) {
        const c = finalCounts(b.k);
        label = pos === finalStart ? 'DO FINAŁU! Losuj 1. rundę' : (c.some(n => n === target - 1) ? `MECZBOL! Losuj rundę ${b.k + 1}` : `Losuj rundę ${b.k + 1}`);
      } else {
        const r = rounds[b.ri];
        const nOut = r.data.contenders.length - 3;
        if (b.phase === 'show') label = b.ri === 0 ? 'LOSUJ KANDYDATÓW' : `DALEJ: ${r.stage === 1 ? S1 + ' ' + SLOT[r.i] : 'Combo ' + (r.i + 1)}`;
        else if (b.phase === 'cut') label = `WYWAL ${nOut}`;
        else label = r.data.contenders.length === 1 ? 'NO TO BIERZ, CO DAJĄ' : 'WYBIERZ 1';
      }
      nextBtn.textContent = label;
      nextBtn.disabled = busy;
      nextBtn.classList.toggle('btn-danger', !b.final && b.phase === 'cut');
    }

    // Podświetlenie biegnie po kartach i zwalnia; `laps` pełnych okrążeń, potem cel.
    async function roulette(nodes, targetIdx, laps, slow) {
      const steps = laps * nodes.length + targetIdx + 1;
      for (let s = 0; s < steps; s++) {
        nodes.forEach(n => n.classList.remove('hot'));
        nodes[s % nodes.length].classList.add('hot');
        S.play('tick');
        await sleep(T(70 + Math.pow(s / steps, 3) * (slow || 420)));
      }
    }

    async function playBeat() {
      const b = beats[pos];
      if (b.final) {
        if (pos === finalStart) {
          renderFinal(0);
          say('WIELKI FINAŁ. ZERO LITOŚCI, ZERO HAMULCÓW.', true);
          S.play('boom'); quake(true); flash();
          kaboom(box, 50, 40, 26);
          await sleep(T(1400));
        }
        const before = finalCounts(b.k);
        const pick = result.final.sequence[b.k];
        const matchPoint = before.some(n => n === target - 1);
        const decisive = before[pick] === target - 1;
        box.classList.toggle('redalert', matchPoint);
        if (matchPoint) {
          say('MECZBOL! Ktoś zaraz zesra się ze stresu…', true);
          if (S.has('matchpoint')) { S.play('matchpoint'); await sleep(T(2200)); }
          else for (let h = 0; h < 3; h++) { S.play('heartbeat'); await sleep(T(700)); }
        } else say(pickOne(LINES.final));
        await roulette($$('.fcard', area), pick, matchPoint ? 3 : 1, matchPoint ? 900 : 420);
        pos++;
        renderFinal(pos - finalStart, pick);
        const hit = $(`.fcard[data-slot="${pick}"]`, area);
        S.play(S.has('final') ? 'final' : 'boom'); quake(decisive);
        kabooomAt(hit, decisive ? 30 : 14);
        shout(pickOne(SHOUTS));
        if (pos >= beats.length) {
          box.classList.remove('redalert');
          say('KONIEC. ZACIŚNIJ POŚLADKI.', true);
          await sleep(T(1100));
          for (let k = 0; k < 3; k++) {
            S.play('boom'); flash(); quake(true);
            kaboom(box, 15 + B.randInt(70), 20 + B.randInt(60), 30);
            shout(['BUM!', 'BUM BUM!', 'ZUG ZUG!'][k]);
            await sleep(T(650));
          }
          renderSide(); renderDone();
          S.play('win');
          const w = B.winnerOf(result);
          setTimeout(() => comboVoice(w.race, w.cls), 1500);
          confetti(container); poopRain(box); quake(true);
        } else if (finalCounts(pos - finalStart)[pick] === target - 1) {
          say(`Combo ${pick + 1} ma MECZBOLA! Ktoś tu się zaraz posra.`, true);
        }
        return;
      }
      const round = rounds[b.ri];
      if (b.phase === 'show') {
        renderSide();
        renderRound(b.ri, 'none');
        say(pickOne(LINES.show));
        S.play('drum');
        $$('.card', area).forEach(c => c.classList.add('shake'));
        await sleep(T(1300));
        const html = round.data.contenders.map(v => cardOf(round, v));
        const nodes = $$('.card', area);
        for (let k = 0; k < nodes.length; k++) {
          const tmp = document.createElement('div');
          tmp.innerHTML = html[k];
          const fresh = tmp.firstElementChild;
          fresh.classList.add('flip-in');
          nodes[k].replaceWith(fresh);
          S.play('flip');
          await sleep(T(260));
        }
        const n = round.data.contenders.length;
        say(n === 1 ? 'Jeden kandydat na krzyż. Zero wyboru, zero litości.' : n <= 3 ? 'Mało ich, nikt nie odpada. Ale wygra tylko jeden.' : 'No to mamy kandydatów. Ktoś zaraz odpadnie.');
      } else if (b.phase === 'cut') {
        const losers = $$('.card', area).filter(c => !round.data.advancing.includes(c.dataset.v));
        for (let li = 0; li < losers.length; li++) {
          say(pickOne(LINES.cut));
          const alive = $$('.card', area).filter(c => !c.classList.contains('out'));
          await roulette(alive, alive.indexOf(losers[li]), 1, 300);
          await sleep(T(450));
          const c = losers[li];
          c.classList.remove('hot');
          c.classList.add('out');
          c.insertAdjacentHTML('beforeend', `<span class="stamp stamp-in">${pickOne(STAMPS)}</span>${RAGE_FU}`);
          S.play('stamp'); quake();
          await sleep(T(250));
          S.play(li % 2 ? 'sad' : 'howl');
          say(`${c.querySelector('.card-name').textContent}… ${pickOne(DEATHS)}`, true);
          await sleep(T(1100));
        }
      } else {
        const alive = $$('.card', area).filter(c => !c.classList.contains('out'));
        const idx = alive.findIndex(c => c.dataset.v === round.data.winner);
        say(alive.length === 1 ? 'Nie ma wyboru, frajerze. Bierzesz, co dają.' : pickOne(LINES.crown), true);
        S.play('drum');
        await sleep(T(900));
        const fake = alive.length > 1 && B.randInt(2) === 0;
        if (alive.length === 1) {
          alive[0].classList.add('hot');
          await sleep(T(700));
        } else if (fake) {
          const near = (idx + alive.length - 1) % alive.length;
          await roulette(alive, near, 3, 650);
          say('TO TEN?!', true);
          await sleep(T(1100));
          S.play('tick');
          alive.forEach(n => n.classList.remove('hot'));
          alive[idx].classList.add('hot');
          say('A JEDNAK CHUJA! NIE TEN!', true);
          quake();
          await sleep(T(500));
        } else {
          await roulette(alive, idx, 3, 650);
          await sleep(T(600));
        }
        alive.forEach(c => { c.classList.remove('hot'); if (c.dataset.v !== round.data.winner) c.classList.add('dim'); });
        const w = alive[idx];
        w.classList.add('crowned');
        w.insertAdjacentHTML('beforeend', `<span class="crown-tag">WYBRANIEC</span>${RAGE_SWEET}`);
        flash();
        S.play('crown');
        if (round.stage === 2) {
          const c = combos[round.i];
          S.voice(`combo:${c.race}|${c.cls}`) || S.voice(byClass ? 'race:' + c.race : 'class:' + c.cls);
        } else S.voice((round.kind === 'class' ? 'class:' : 'race:') + round.data.winner);
        say(`${w.querySelector('.card-name').textContent}! Jedni się cieszą, reszta płacze w poduszkę.`, true);
      }
      pos++;
      renderSide();
    }

    async function step() {
      if (busy || pos >= beats.length) return;
      busy = true; updateButtons();
      try { await playBeat(); } finally { save(); busy = false; updateButtons(); if (pos >= beats.length && opts.onDone) opts.onDone(); }
    }

    nextBtn.addEventListener('click', step);

    renderAt();
    return { finished: () => pos >= beats.length };
  }

  /* ---------- nagłówek ---------- */

  function renderLanding() {
    const grid = $('#profiles');
    grid.innerHTML = PLAYERS.map(p => `
      <button type="button" class="profile ${state.nick && sameNick(state.nick, p.nick) ? 'on' : ''}" data-nick="${esc(p.nick)}">
        ${avatar(p.nick, 132)}
        <span class="profile-nick">${esc(p.nick)}</span>
        ${p.tag ? `<span class="profile-tag">${esc(p.tag)}</span>` : ''}
      </button>`).join('');
    $$('.profile', grid).forEach(b => b.addEventListener('click', () => enterAs(b.dataset.nick)));
    const back = $('#welcomeBack');
    if (state.nick) {
      back.hidden = false;
      back.innerHTML = `${avatar(state.nick, 44)}<span>Siema znowu, <b>${esc(state.nick)}</b>.</span><button type="button" class="btn" id="enterSaved">Wchodzę jako ${esc(state.nick)}</button>`;
      $('#enterSaved').addEventListener('click', () => enterAs(state.nick));
    } else back.hidden = true;
  }

  function enterAs(nick) {
    setNick(nick);
    const p = playerOf(nick);
    if (!S.voice('player:' + (p ? p.nick : nick))) S.play('crown');
    location.hash = '#random';
  }

  function renderProfileChip() {
    const chip = $('#profileChip');
    chip.innerHTML = state.nick
      ? `${avatar(state.nick, 34)}<span>Grasz jako <b>${esc(state.nick)}</b></span><a href="#start" class="btn btn-ghost btn-sm">Zmień</a>`
      : '<span>Tylko oglądasz.</span><a href="#start" class="btn btn-ghost btn-sm">Wybierz profil</a>';
  }

  function setupToggles() {
    const m = $('#muteBtn');
    const paint = () => { m.textContent = S.isMuted() ? 'Dźwięk: OFF (cykor)' : 'Dźwięk: NA PEŁNĄ'; m.setAttribute('aria-pressed', String(!S.isMuted())); };
    m.addEventListener('click', () => { S.toggle(); paint(); S.play('tick'); });
    paint();
  }

  /* ---------- wybór frakcji ---------- */

  function factionPicker(root, current, onPick) {
    root.innerHTML = ['Horde', 'Alliance'].map(f => `
      <button type="button" class="faction-btn ${f === current ? 'on' : ''} ${f.toLowerCase()}" data-f="${f}" aria-pressed="${f === current}">
        ${I.faction(f)}<span>${B.FACTION_PL[f]}</span></button>`).join('');
    $$('.faction-btn', root).forEach(b => b.addEventListener('click', () => {
      $$('.faction-btn', root).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      document.body.dataset.faction = b.dataset.f;
      S.play('tick');
      onPick(b.dataset.f);
    }));
  }

  /* ---------- randomizer dla każdego ---------- */

  function setupRandomizer() {
    factionPicker($('#randFaction'), state.randFaction, f => { state.randFaction = f; });
    $('#randGo').addEventListener('click', () => {
      S.play('readycheck');
      const result = B.runTournament(state.randFaction, cfg.FINAL_TARGET);
      const box = $('#randReveal');
      box.hidden = false;
      Reveal(box, result, {
        actions(el) {
          el.innerHTML = '<button type="button" class="btn">Jeszcze raz, kurwa!</button>';
          $('button', el).addEventListener('click', () => $('#randGo').click());
        }
      });
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#quickGo').addEventListener('click', () => {
      const combos = B.racesOf(state.randFaction).flatMap(r => r.classes.map(c => [r.id, c]));
      const [race, cls] = combos[B.randInt(combos.length)];
      $('#quickOut').innerHTML = `<div class="quick-card" style="--cc:${B.CLASS_COLORS[cls]}">
        <div class="winner-icos">${I.race(race)}${I.cls(cls)}</div>
        <div><div class="winner-name">${esc(B.comboLabel(race, cls))}</div>
        <p class="winner-meme">${esc(B.RACE_MEMES[race])} ${esc(B.CLASS_MEMES[cls])}</p></div></div>`;
      S.play('crown');
      comboVoice(race, cls);
    });
  }

  /* ---------- turniej ---------- */

  function eventDays() {
    const days = [];
    const d = new Date(cfg.EVENT_START + 'T12:00:00Z');
    const end = new Date(cfg.EVENT_END + 'T12:00:00Z');
    while (d <= end) { days.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
    return days;
  }

  function monthGrid(days, cellFn) {
    const byMonth = {};
    days.forEach(d => { (byMonth[d.slice(0, 7)] = byMonth[d.slice(0, 7)] || []).push(d); });
    const head = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(h => `<div class="dow">${h}</div>`).join('');
    return Object.keys(byMonth).map(m => {
      const list = byMonth[m];
      const first = new Date(list[0] + 'T12:00:00Z');
      const lead = (first.getUTCDay() + 6) % 7;
      const title = new Intl.DateTimeFormat('pl-PL', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(first);
      return `<div class="month"><h4>${esc(title)}</h4><div class="mgrid">${head}${'<div class="blank"></div>'.repeat(lead)}${list.map(cellFn).join('')}</div></div>`;
    }).join('');
  }

  function setNick(nick) {
    state.nick = nick;
    try { nick ? localStorage.setItem('bogowie:nick', nick) : localStorage.removeItem('bogowie:nick'); } catch (e) { /* ignore */ }
    renderTournament(); renderProfileChip(); renderLanding();
  }

  function renderTournament() {
    const box = $('#tourBody');
    const today = B.todayWarsaw();
    const demo = api.mode === 'demo'
      ? `<div class="banner demo"><b>TRYB DEMO.</b> Baza jeszcze niepodpięta, więc wpisy lądują tylko w tej przeglądarce. Do testów zajebiście, do turnieju chujowo.</div>` : '';

    if (!state.nick) {
      box.innerHTML = `${demo}
        <div class="panel center">
          <h3>A ty to kto?</h3>
          <p class="muted">Turniej gra się pod swoim nickiem. Wróć na start i kliknij swoją mordę.</p>
          <a class="btn btn-big" href="#start">Wybierz profil</a>
        </div>`;
      return;
    }

    const nick = state.nick;
    const mine = state.entries.filter(e => sameNick(e.nick, nick));
    const taken = new Set(mine.map(e => e.t_date));
    const over = today > cfg.EVENT_END;
    const notYet = today < cfg.EVENT_START;
    const avail = eventDays().filter(d => d <= today && !taken.has(d));
    if (!avail.includes(state.selectedDate)) state.selectedDate = avail.includes(today) ? today : (avail[avail.length - 1] || null);

    const userBar = `<div class="userbar">${avatar(nick, 48)}<span>Grasz jako <b>${esc(nick)}</b>. Powodzenia, bo się przyda.</span></div>`;

    let form;
    if (over) form = `<div class="panel center"><h3>Po ptokach</h3><p class="muted">Ostatni turniej był ${fmtDate(cfg.EVENT_END, { year: 'numeric' })}. Zostały wyniki i wymówki.</p></div>`;
    else if (notYet) form = `<div class="panel center"><h3>Spokojnie, kowboju</h3><p class="muted">Start ${fmtDate(cfg.EVENT_START, { year: 'numeric' })}.</p></div>`;
    else if (!avail.length) form = `<div class="panel center"><h3>Wszystko odklepane</h3><p class="muted">Masz wpis na każdy dzień, jaki się dało. Idź się wyśpij, wróć jutro.</p></div>`;
    else {
      const grid = monthGrid(eventDays(), d => {
        const future = d > today, has = taken.has(d);
        const label = `${fmtDate(d)}${has ? ', masz już wpis' : future ? ', jeszcze nie' : ''}`;
        return `<button type="button" class="day ${has ? 'has' : ''} ${d === state.selectedDate ? 'sel' : ''} ${d === today ? 'today' : ''}" data-d="${d}" ${future || has ? 'disabled' : ''} aria-label="${esc(label)}" aria-pressed="${d === state.selectedDate}">${parseInt(d.slice(8), 10)}${has ? '<i class="tick">✓</i>' : ''}</button>`;
      });
      form = `
        <div class="panel">
          <h3>1. Za kogo dziś napierdalasz?</h3>
          <div class="faction-row" id="tourFaction"></div>
          <h3>2. Za który dzień?</h3>
          <p class="muted small">Dziś albo zaległy dzień bez wpisu. W przyszłość się nie da, cwaniaku.</p>
          <div class="cal pick">${grid}</div>
          <div class="go-row">
            <p class="small">Wybrano: <b id="selDate">${state.selectedDate ? fmtDate(state.selectedDate, { weekday: 'long' }) : '—'}</b></p>
            <button type="button" class="btn btn-big btn-danger" id="startBtn">JEDZIEMY Z KURWAMI</button>
          </div>
        </div>`;
    }

    const history = mine.slice().sort((a, b) => b.t_date.localeCompare(a.t_date)).map(e => `
      <li><span class="date">${fmtDate(e.t_date)}</span>${comboChip(e.winner_race, e.winner_class)}
      <button type="button" class="btn btn-ghost btn-sm" data-replay="${esc(e.id)}">Obejrzyj jeszcze raz</button></li>`).join('');

    box.innerHTML = `${demo}${userBar}${form}
      <div id="tourReveal" class="reveal-box" hidden></div>
      <div class="panel"><h3>Twoje turnieje</h3>${history ? `<ul class="history">${history}</ul>` : '<p class="muted">Pusto. Jak w twoim banku po wizycie na AH.</p>'}</div>`;

    if ($('#tourFaction')) factionPicker($('#tourFaction'), state.faction, f => { state.faction = f; });
    $$('.cal.pick .day').forEach(b => b.addEventListener('click', () => {
      state.selectedDate = b.dataset.d;
      $$('.cal.pick .day').forEach(x => { x.classList.toggle('sel', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      $('#selDate').textContent = fmtDate(b.dataset.d, { weekday: 'long' });
      S.play('tick');
    }));
    if ($('#startBtn')) $('#startBtn').addEventListener('click', openWarning);
    $$('[data-replay]').forEach(b => b.addEventListener('click', () => {
      const e = state.entries.find(x => x.id === b.dataset.replay);
      if (e) showTourReveal(e);
    }));
  }

  function showTourReveal(entry) {
    const box = $('#tourReveal');
    box.hidden = false;
    Reveal(box, entry.result, {
      key: 'bogowie:reveal:' + entry.id,
      actions(el) { el.innerHTML = '<a class="btn" href="#kalendarz">Pokaż w kalendarzu</a>'; }
    });
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openWarning() {
    if (!state.selectedDate) { toast('Wybierz dzień, geniuszu.', true); return; }
    $('#warnWhat').innerHTML = `${avatar(state.nick, 36)}${I.faction(state.faction)}<span><b>${esc(state.nick)}</b> · ${esc(B.FACTION_PL[state.faction])} · ${esc(fmtDate(state.selectedDate, { weekday: 'long' }))}</span>`;
    $('#warnCheck').checked = false;
    $('#warnGo').disabled = true;
    S.play('stamp');
    $('#warnDialog').showModal();
  }

  async function confirmStart() {
    const go = $('#warnGo');
    go.disabled = true;
    go.textContent = 'Los się ładuje…';
    try {
      const entry = await api.start(state.nick, state.faction, state.selectedDate);
      S.play('readycheck');
      $('#warnDialog').close();
      state.entries = await api.listEntries();
      renderAll();
      showTourReveal(state.entries.find(e => e.id === entry.id) || entry);
    } catch (e) {
      toast(e.message, true);
    } finally {
      go.textContent = 'WCHODZĘ W TO';
      go.disabled = !$('#warnCheck').checked;
    }
  }

  /* ---------- kalendarz ---------- */

  function entryCard(e) {
    const r = e.result || {};
    const fin = r.final ? (() => { const c = [0, 0, 0]; r.final.sequence.forEach(s => c[s]++); return c.join(':'); })() : '';
    const byClass = r.order === 'class';
    const first = (r.stage1 || []).map((x, i) => `<span class="pill">${SLOT[i]}: <span class="mini">${byClass ? I.cls(x.winner) : I.race(x.winner)}</span>${esc(byClass ? x.winner : raceName(x.winner))}</span>`).join('');
    const combos = r.stage2 ? B.combosOf(r).map((c, i) => `<span class="pill">${i + 1}: ${comboChip(c.race, c.cls)}</span>`).join('') : '';
    const seq = r.final ? r.final.sequence.map(s => `<span class="logchip">${s + 1}</span>`).join('') : '';
    return `<article class="entry">
      <header>${avatar(e.nick, 40)}<b>${esc(e.nick)}</b><span class="mini fac">${I.faction(e.faction)}</span><span class="muted small">${esc(B.FACTION_PL[e.faction] || e.faction)}</span></header>
      <div class="entry-win">${comboChip(e.winner_race, e.winner_class)}<span class="muted small">finał ${fin}</span></div>
      <details><summary>Jak do tego doszło</summary>
        <p class="small"><b>${byClass ? 'Klasy' : 'Rasy'}:</b> ${first}</p>
        <p class="small"><b>Combo:</b> ${combos}</p>
        <p class="small"><b>Finał, kolejne trafienia:</b> ${seq}</p>
      </details>
    </article>`;
  }

  function renderCalendar() {
    const today = B.todayWarsaw();
    const byDay = {};
    state.entries.forEach(e => { (byDay[e.t_date] = byDay[e.t_date] || []).push(e); });
    const grid = monthGrid(eventDays(), d => {
      const list = byDay[d] || [];
      const av = list.slice(0, 4).map(e => avatar(e.nick, 22)).join('');
      const more = list.length > 4 ? `<span class="more">+${list.length - 4}</span>` : '';
      const label = `${fmtDate(d)}: ${list.length} ${list.length === 1 ? 'wpis' : 'wpisów'}`;
      return `<button type="button" class="day ${d === today ? 'today' : ''} ${d === state.calDay ? 'sel' : ''} ${d > today ? 'future' : ''} ${d === cfg.EVENT_END ? 'deadline' : ''}" data-d="${d}" aria-label="${esc(label)}">
        <span class="dnum">${parseInt(d.slice(8), 10)}</span><span class="avs">${av}${more}</span></button>`;
    });
    $('#calGrid').innerHTML = `<div class="cal big">${grid}</div>`;
    $$('#calGrid .day').forEach(b => b.addEventListener('click', () => { state.calDay = b.dataset.d; renderCalendar(); S.play('tick'); }));
    const det = $('#calDetail');
    if (!state.calDay) {
      const total = state.entries.length;
      det.innerHTML = `<p class="muted">Kliknij dzień i zobacz, kogo los wyruchał. Do tej pory: <b>${total}</b> ${total === 1 ? 'turniej' : 'turniejów'}.</p>`;
      return;
    }
    const list = byDay[state.calDay] || [];
    det.innerHTML = `<h3>${esc(fmtDate(state.calDay, { weekday: 'long', year: 'numeric' }))}</h3>` +
      (list.length ? `<div class="entries">${list.map(entryCard).join('')}</div>` : '<p class="muted">Nikt nic. Cisza jak po wipe’ie na trashu.</p>');
  }

  /* ---------- gracze i top 3 ---------- */

  function renderPlayers() {
    const users = {};
    knownNicks().forEach(n => { users[B.nickKey(n)] = { name: n, n: 0, combos: {} }; });
    state.entries.forEach(e => {
      const p = playerOf(e.nick);
      const k = B.nickKey(p ? p.nick : e.nick);
      const u = users[k] = users[k] || { name: e.nick, n: 0, combos: {} };
      u.n++;
      const ck = e.winner_race + '|' + e.winner_class;
      const c = u.combos[ck] = u.combos[ck] || { race: e.winner_race, cls: e.winner_class, n: 0, last: '' };
      c.n++; if (e.t_date > c.last) c.last = e.t_date;
    });
    const list = Object.values(users).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'pl'));
    if (!list.length) { $('#playersBody').innerHTML = '<p class="muted">Nikt jeszcze nie zagrał. Same cykory.</p>'; return; }
    const medals = ['gold', 'silver', 'bronze'];
    $('#playersBody').innerHTML = `<div class="players">${list.map(u => {
      const top = Object.values(u.combos).sort((a, b) => b.n - a.n || b.last.localeCompare(a.last)).slice(0, 3);
      const p = playerOf(u.name);
      const alias = p && p.aliases.length ? ` <span class="muted small">aka ${esc(p.aliases.join(', '))}</span>` : '';
      return `<article class="player">
        <header>${avatar(u.name, 64)}<div><b>${esc(u.name)}</b>${alias}<span class="muted small">${u.n ? `${u.n} ${u.n === 1 ? 'turniej' : 'turniejów'}` : 'jeszcze nie grał, cykor'}</span></div></header>
        ${top.length ? `<ol class="top3">${top.map((c, i) => `<li><span class="medal ${medals[i]}">${i + 1}</span>${comboChip(c.race, c.cls)}<span class="cnt">×${c.n}</span></li>`).join('')}</ol>` : '<p class="small muted">Zero wyników. Zero chwały.</p>'}
      </article>`;
    }).join('')}</div>`;
  }

  /* ---------- nawigacja i start ---------- */

  function route() {
    const id = (location.hash || '#start').slice(1);
    const known = ['random', 'turniej', 'gracze', 'kalendarz'];
    const onLanding = !known.includes(id);
    $('#landing').hidden = !onLanding;
    $('#app').hidden = onLanding;
    if (!onLanding) known.forEach(k => { $('#sec-' + k).hidden = k !== id; });
    $$('.nav a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'page' : 'false'));
    window.scrollTo(0, 0);
  }

  function renderAll() { renderTournament(); renderCalendar(); renderPlayers(); renderLanding(); renderProfileChip(); }

  async function boot() {
    document.body.dataset.faction = state.randFaction;
    setupToggles();
    setupRandomizer();
    window.addEventListener('hashchange', route);
    route();
    $$('.deadlineTxt').forEach(el => { el.textContent = fmtDate(cfg.EVENT_END, { year: 'numeric' }); });
    $('#guestBtn').addEventListener('click', () => { setNick(null); location.hash = '#random'; });
    $('#otherForm').addEventListener('submit', ev => {
      ev.preventDefault();
      try { const n = B.cleanNick($('#otherNick').value); const p = playerOf(n); enterAs(p ? p.nick : n); }
      catch (e) { toast(e.message, true); }
    });
    $('#warnCheck').addEventListener('change', e => { $('#warnGo').disabled = !e.target.checked; });
    $('#warnCancel').addEventListener('click', () => $('#warnDialog').close());
    $('#warnGo').addEventListener('click', confirmStart);
    try {
      state.entries = await api.listEntries();
    } catch (e) {
      toast('Nie da się pobrać wyników: ' + e.message, true);
    }
    renderAll();
  }

  boot();
})();
