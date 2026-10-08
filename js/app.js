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

  const STAMPS = ['ODPADA', 'NARA', 'WYPAD', 'NOPE', 'PA PA', 'DO PIACHU', 'SKIP', 'BYE'];
  const SLOT = ['A', 'B', 'C'];

  const state = { user: null, admin: false, entries: [], speed: 1, selectedDate: null, faction: 'Horde', randFaction: 'Horde', calDay: null };
  try { state.speed = localStorage.getItem('bogowie:fast') === '1' ? 0.15 : 1; } catch (e) { /* ignore */ }
  const T = ms => Math.round(ms * state.speed);

  /* ---------- drobne klocki ---------- */

  const raceName = id => (B.RACE_BY_ID[id] ? B.RACE_BY_ID[id].name : id);

  function raceCard(id, extra) {
    return `<div class="card race ${extra || ''}" data-v="${esc(id)}"><div class="card-ico">${I.race(id)}</div><div class="card-name${raceName(id).length > 12 ? ' long' : ''}">${esc(raceName(id))}</div></div>`;
  }
  function classCard(cls, raceId, extra) {
    return `<div class="card cls ${extra || ''}" data-v="${esc(cls)}" style="--cc:${B.CLASS_COLORS[cls] || '#999'}"><div class="card-ico">${I.cls(cls)}</div><div class="card-name">${esc(cls)}</div><div class="card-sub">${esc(raceName(raceId))}</div></div>`;
  }
  function mysteryCard() {
    return `<div class="card mystery"><div class="card-ico">${I.mystery()}</div><div class="card-name">???</div></div>`;
  }
  function comboChip(raceId, cls) {
    return `<span class="combo-chip" style="--cc:${B.CLASS_COLORS[cls] || '#999'}"><span class="mini">${I.race(raceId)}</span><span class="mini">${I.cls(cls)}</span><span>${esc(B.comboLabel(raceId, cls))}</span></span>`;
  }
  function avatar(name, url, size) {
    const s = size || 32;
    if (url && /^https:\/\//.test(url)) {
      return `<img class="avatar" src="${esc(url)}" alt="" width="${s}" height="${s}" style="width:${s}px;height:${s}px" loading="lazy" referrerpolicy="no-referrer">`;
    }
    let h = 0; for (const ch of String(name || '?')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const hue = h % 360;
    return `<span class="avatar avatar-txt" style="width:${s}px;height:${s}px;font-size:${Math.round(s * 0.45)}px;background:hsl(${hue} 55% 42%)">${esc((name || '?').trim().charAt(0).toUpperCase())}</span>`;
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

  /* ---------- odsłanianie turnieju ---------- */

  function Reveal(container, result, opts) {
    opts = opts || {};
    const rounds = [];
    result.stage1.forEach((r, i) => rounds.push({ stage: 1, i, kind: 'race', data: r, title: `Losowanie ${i + 1}/3 → Rasa ${SLOT[i]}` }));
    result.stage2.forEach((r, i) => rounds.push({ stage: 2, i, kind: 'class', data: r, title: `Losowanie ${i + 1}/3 → Combo ${i + 1} (${raceName(r.race)})` }));
    const beats = [];
    rounds.forEach((r, ri) => ['show', 'cut', 'crown'].forEach(phase => beats.push({ ri, phase })));
    result.final.sequence.forEach((slot, k) => beats.push({ final: true, k }));
    const target = result.final.target || 4;

    let pos = 0, busy = false;
    if (opts.key) { try { pos = Math.min(beats.length, parseInt(localStorage.getItem(opts.key) || '0', 10) || 0); } catch (e) { /* ignore */ } }
    const save = () => { if (opts.key) { try { localStorage.setItem(opts.key, String(pos)); } catch (e) { /* ignore */ } } };

    container.innerHTML = `
      <div class="reveal">
        <div class="rv-main">
          <div class="rv-head"><span class="rv-stage"></span><h3 class="rv-title"></h3></div>
          <div class="rv-area" aria-live="polite"></div>
          <div class="rv-controls">
            <button type="button" class="btn btn-big rv-next"></button>
            <button type="button" class="btn btn-ghost rv-auto" hidden>Auto do końca</button>
            <button type="button" class="btn btn-ghost rv-skip">Pokaż wynik od razu</button>
          </div>
        </div>
        <aside class="rv-side" aria-label="Podsumowanie"></aside>
      </div>`;
    const area = $('.rv-area', container), side = $('.rv-side', container);
    const nextBtn = $('.rv-next', container), autoBtn = $('.rv-auto', container), skipBtn = $('.rv-skip', container);

    function roundDone(ri) { return pos >= ri * 3 + 3; }
    function finalCounts(upto) {
      const c = [0, 0, 0];
      result.final.sequence.slice(0, upto).forEach(s => c[s]++);
      return c;
    }
    const finalStart = rounds.length * 3;

    function renderSide() {
      const rasy = result.stage1.map((r, i) => roundDone(i)
        ? `<li><b>Rasa ${SLOT[i]}</b><span class="mini">${I.race(r.winner)}</span>${esc(raceName(r.winner))}</li>`
        : `<li class="empty"><b>Rasa ${SLOT[i]}</b>czeka…</li>`).join('');
      const combos = result.stage2.map((r, i) => roundDone(3 + i)
        ? `<li><b>Combo ${i + 1}</b>${comboChip(r.race, r.winner)}</li>`
        : `<li class="empty"><b>Combo ${i + 1}</b>czeka…</li>`).join('');
      side.innerHTML = `
        <div class="side-faction">${I.faction(result.faction)}<span>${esc(B.FACTION_PL[result.faction])}</span></div>
        <h4>Etap 1 · Rasy</h4><ul class="slots">${rasy}</ul>
        <h4>Etap 2 · Combo</h4><ul class="slots">${combos}</ul>
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
        const html = round.kind === 'race' ? raceCard(v, cls) : classCard(v, d.race, cls);
        return html;
      }).join('');
    }

    function addStamps() {
      $$('.card', area).forEach(c => {
        if (c.classList.contains('out') && !$('.stamp', c)) c.insertAdjacentHTML('beforeend', `<span class="stamp">${pickOne(STAMPS)}</span>`);
        if (c.classList.contains('crowned') && !$('.crown-tag', c)) c.insertAdjacentHTML('beforeend', '<span class="crown-tag">WYBRANIEC</span>');
      });
    }

    function renderRound(ri, phase) {
      const round = rounds[ri];
      $('.rv-stage', container).textContent = round.stage === 1 ? 'ETAP 1 · RASY' : 'ETAP 2 · KLASY';
      $('.rv-title', container).textContent = round.title;
      area.innerHTML = `<div class="cards">${cardsFor(round, phase)}</div>`;
      addStamps();
    }

    function renderFinal(upto, highlight) {
      const c = finalCounts(upto);
      $('.rv-stage', container).textContent = 'FINAŁ · BO7';
      $('.rv-title', container).textContent = `Kto pierwszy trafi ${target} razy, ten wygrywa`;
      const cards = result.stage2.map((r, i) => {
        const pips = Array.from({ length: target }, (_, p) => `<i class="${p < c[i] ? 'on' : ''}"></i>`).join('');
        return `<div class="fcard ${highlight === i ? 'hot' : ''}" data-slot="${i}" style="--cc:${B.CLASS_COLORS[r.winner]}">
          <div class="fcard-tag">Combo ${i + 1}</div>
          <div class="fcard-icos">${I.race(r.race)}${I.cls(r.winner)}</div>
          <div class="fcard-name">${esc(B.comboLabel(r.race, r.winner))}</div>
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
      area.innerHTML = `
        <div class="winner">
          <span class="gg">GG EZ</span>
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
      skipBtn.hidden = done;
      autoBtn.hidden = done || pos < finalStart;
      if (done) return;
      const b = beats[pos];
      let label;
      if (b.final) label = pos === finalStart ? 'DO FINAŁU! Losuj 1. rundę' : `Losuj rundę ${b.k + 1}`;
      else {
        const r = rounds[b.ri];
        const nOut = r.data.contenders.length - 3;
        if (b.phase === 'show') label = b.ri === 0 ? 'LOSUJ KANDYDATÓW' : `DALEJ: ${r.stage === 1 ? 'Rasa ' + SLOT[r.i] : 'Combo ' + (r.i + 1)}`;
        else if (b.phase === 'cut') label = `WYWAL ${nOut}`;
        else label = 'WYBIERZ 1';
      }
      nextBtn.textContent = label;
      nextBtn.disabled = busy;
      autoBtn.disabled = busy;
      skipBtn.disabled = busy;
    }

    async function roulette(nodes, targetIdx, rounds_) {
      const steps = (rounds_ || 2) * nodes.length + targetIdx + 1;
      for (let s = 0; s < steps; s++) {
        nodes.forEach(n => n.classList.remove('hot'));
        nodes[s % nodes.length].classList.add('hot');
        S.play('tick');
        await sleep(T(60 + Math.pow(s / steps, 3) * 260));
      }
    }

    async function playBeat() {
      const b = beats[pos];
      if (b.final) {
        if (pos === finalStart) { renderFinal(0); await sleep(T(250)); }
        const nodes = $$('.fcard', area);
        await roulette(nodes, b.k >= 0 ? result.final.sequence[b.k] : 0, 1);
        pos++;
        renderFinal(pos - finalStart, result.final.sequence[b.k]);
        S.play('flip');
        if (pos >= beats.length) {
          await sleep(T(700));
          renderSide(); renderDone(); S.play('win'); confetti(container);
        }
        return;
      }
      const round = rounds[b.ri];
      if (b.phase === 'show') {
        renderSide();
        renderRound(b.ri, 'none');
        S.play('drum');
        $$('.card', area).forEach(c => c.classList.add('shake'));
        await sleep(T(750));
        const html = round.data.contenders.map(v => round.kind === 'race' ? raceCard(v) : classCard(v, round.data.race));
        const nodes = $$('.card', area);
        for (let k = 0; k < nodes.length; k++) {
          const tmp = document.createElement('div');
          tmp.innerHTML = html[k];
          const fresh = tmp.firstElementChild;
          fresh.classList.add('flip-in');
          nodes[k].replaceWith(fresh);
          S.play('flip');
          await sleep(T(140));
        }
      } else if (b.phase === 'cut') {
        const losers = $$('.card', area).filter(c => !round.data.advancing.includes(c.dataset.v));
        for (const c of losers) {
          c.classList.add('out');
          c.insertAdjacentHTML('beforeend', `<span class="stamp stamp-in">${pickOne(STAMPS)}</span>`);
          S.play('stamp');
          await sleep(T(420));
        }
        S.play('sad');
      } else {
        const alive = $$('.card', area).filter(c => !c.classList.contains('out'));
        const idx = alive.findIndex(c => c.dataset.v === round.data.winner);
        await roulette(alive, idx, 2);
        alive.forEach(c => { c.classList.remove('hot'); if (c.dataset.v !== round.data.winner) c.classList.add('dim'); });
        const w = alive[idx];
        w.classList.add('crowned');
        w.insertAdjacentHTML('beforeend', '<span class="crown-tag">WYBRANIEC</span>');
        S.play('crown');
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
    autoBtn.addEventListener('click', async () => {
      const prev = state.speed; state.speed = Math.min(prev, 0.35);
      while (pos < beats.length) { await step(); }
      state.speed = prev;
    });
    skipBtn.addEventListener('click', () => {
      if (busy) return;
      pos = beats.length; save();
      renderAt(); S.play('win'); confetti(container);
      if (opts.onDone) opts.onDone();
    });

    renderAt();
    return { finished: () => pos >= beats.length };
  }

  /* ---------- nagłówek: zdjęcia, dźwięk, tempo ---------- */

  function renderPhotos() {
    const box = $('#photos');
    const photos = (cfg.PHOTOS || []).slice(0, 4);
    const caps = ['tu będzie czyjaś morda', 'tu też', 'i tu, jak się nie wstydzi'];
    box.innerHTML = photos.length
      ? photos.map((p, i) => `<figure class="polaroid" style="--r:${[-6, 4, -2, 7][i]}deg"><img src="${esc(p)}" alt="Bogowie, zdjęcie ${i + 1}" loading="lazy"></figure>`).join('')
      : caps.map((c, i) => `<figure class="polaroid empty" style="--r:${[-6, 4, -3][i]}deg"><div class="ph">JPG<br>SOON™</div><figcaption>${c}</figcaption></figure>`).join('');
  }

  function setupToggles() {
    const m = $('#muteBtn');
    const paintM = () => { m.textContent = S.isMuted() ? 'Dźwięk: OFF' : 'Dźwięk: ON'; m.setAttribute('aria-pressed', String(!S.isMuted())); };
    m.addEventListener('click', () => { S.toggle(); paintM(); S.play('tick'); });
    paintM();
    const f = $('#fastBtn');
    const paintF = () => { f.textContent = state.speed < 1 ? 'Tempo: niecierpliwe' : 'Tempo: dramatyczne'; f.setAttribute('aria-pressed', String(state.speed < 1)); };
    f.addEventListener('click', () => {
      state.speed = state.speed < 1 ? 1 : 0.15;
      try { localStorage.setItem('bogowie:fast', state.speed < 1 ? '1' : '0'); } catch (e) { /* ignore */ }
      paintF();
    });
    paintF();
  }

  /* ---------- wybór frakcji ---------- */

  function factionPicker(root, current, onPick) {
    root.innerHTML = ['Horde', 'Alliance'].map(f => `
      <button type="button" class="faction-btn ${f === current ? 'on' : ''} ${f.toLowerCase()}" data-f="${f}" aria-pressed="${f === current}">
        ${I.faction(f)}<span>${B.FACTION_PL[f]}</span></button>`).join('');
    $$('.faction-btn', root).forEach(b => b.addEventListener('click', () => {
      $$('.faction-btn', root).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      S.play('tick');
      onPick(b.dataset.f);
    }));
  }

  /* ---------- randomizer dla każdego ---------- */

  function setupRandomizer() {
    factionPicker($('#randFaction'), state.randFaction, f => { state.randFaction = f; });
    $('#randGo').addEventListener('click', () => {
      const result = B.runTournament(state.randFaction, cfg.FINAL_TARGET);
      const box = $('#randReveal');
      box.hidden = false;
      Reveal(box, result, {
        actions(el) {
          el.innerHTML = '<button type="button" class="btn">Jeszcze raz!</button>';
          $('button', el).addEventListener('click', () => $('#randGo').click());
        }
      });
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#quickGo').addEventListener('click', () => {
      const races = B.racesOf(state.randFaction);
      const combos = races.flatMap(r => r.classes.map(c => [r.id, c]));
      const [race, cls] = combos[B.randInt(combos.length)];
      const out = $('#quickOut');
      out.innerHTML = `<div class="quick-card" style="--cc:${B.CLASS_COLORS[cls]}">
        <div class="winner-icos">${I.race(race)}${I.cls(cls)}</div>
        <div><div class="winner-name">${esc(B.comboLabel(race, cls))}</div>
        <p class="winner-meme">${esc(B.RACE_MEMES[race])} ${esc(B.CLASS_MEMES[cls])}</p></div></div>`;
      S.play('crown');
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

  function renderTournament() {
    const box = $('#tourBody');
    const today = B.todayWarsaw();
    const demo = api.mode === 'demo'
      ? `<div class="banner demo"><b>TRYB DEMO.</b> Supabase nie jest jeszcze podpięty, więc wpisy zapisują się tylko w tej przeglądarce. Do testów — idealnie. Do turnieju — nie.</div>` : '';
    if (!state.user) {
      box.innerHTML = `${demo}
        <div class="panel center">
          <h3>Najpierw pokaż się Discordowi</h3>
          <p class="muted">Kalendarz i wyniki widzi każdy. Turniej zrobisz dopiero po zalogowaniu, żeby było wiadomo, kogo potem wyśmiewać.</p>
          ${api.mode === 'demo' ? '<p><label class="small" for="demoName">Nick do testów (demo):</label><br><input id="demoName" class="input" value="Demo Gracz" maxlength="32"></p>' : ''}
          <button type="button" class="btn btn-big btn-discord" id="loginBtn">Zaloguj przez Discord${api.mode === 'demo' ? ' (demo)' : ''}</button>
        </div>`;
      $('#loginBtn').addEventListener('click', () => api.login($('#demoName') ? $('#demoName').value : undefined).catch(e => toast(e.message, true)));
      return;
    }
    const mine = state.entries.filter(e => e.user_id === state.user.id);
    const taken = new Set(mine.map(e => e.t_date));
    const over = today > cfg.EVENT_END;
    const notYet = today < cfg.EVENT_START;
    const avail = eventDays().filter(d => d <= today && !taken.has(d));
    if (!avail.includes(state.selectedDate)) state.selectedDate = avail.includes(today) ? today : (avail[avail.length - 1] || null);

    const userBar = `<div class="userbar">${avatar(state.user.name, state.user.avatar, 40)}<span>Siema, <b>${esc(state.user.name)}</b>${state.admin ? ' <span class="tag">ADMIN</span>' : ''}</span>
      <button type="button" class="btn btn-ghost btn-sm" id="logoutBtn">Wyloguj</button></div>`;

    let form;
    if (over) form = `<div class="panel center"><h3>Event zakończony</h3><p class="muted">Ostatni turniej można było zrobić ${fmtDate(cfg.EVENT_END, { year: 'numeric' })}. Teraz zostały tylko wyniki i wymówki.</p></div>`;
    else if (notYet) form = `<div class="panel center"><h3>Jeszcze nie teraz</h3><p class="muted">Start ${fmtDate(cfg.EVENT_START, { year: 'numeric' })}.</p></div>`;
    else if (!avail.length) form = `<div class="panel center"><h3>Wszystko odklepane</h3><p class="muted">Masz wpis na każdy dzień, który się dało. Wróć jutro.</p></div>`;
    else {
      const grid = monthGrid(eventDays(), d => {
        const future = d > today, has = taken.has(d);
        const dis = future || has;
        const label = `${fmtDate(d)}${has ? ', masz już wpis' : future ? ', jeszcze nie' : ''}`;
        return `<button type="button" class="day ${has ? 'has' : ''} ${d === state.selectedDate ? 'sel' : ''} ${d === today ? 'today' : ''}" data-d="${d}" ${dis ? 'disabled' : ''} aria-label="${esc(label)}" aria-pressed="${d === state.selectedDate}">${parseInt(d.slice(8), 10)}${has ? '<i class="tick">✓</i>' : ''}</button>`;
      });
      form = `
        <div class="panel">
          <h3>1. Frakcja na dziś</h3>
          <div class="faction-row" id="tourFaction"></div>
          <h3>2. Za który dzień?</h3>
          <p class="muted small">Dziś albo zaległy dzień bez wpisu. W przyszłość się nie da, cwaniaku.</p>
          <div class="cal pick">${grid}</div>
          <div class="go-row">
            <p class="small">Wybrano: <b id="selDate">${state.selectedDate ? fmtDate(state.selectedDate, { weekday: 'long' }) : '—'}</b></p>
            <button type="button" class="btn btn-big btn-danger" id="startBtn">ZACZYNAMY TURNIEJ</button>
          </div>
        </div>`;
    }

    const history = mine.slice().sort((a, b) => b.t_date.localeCompare(a.t_date)).map(e => `
      <li><span class="date">${fmtDate(e.t_date)}</span>${comboChip(e.winner_race, e.winner_class)}
      <button type="button" class="btn btn-ghost btn-sm" data-replay="${esc(e.id)}">Przebieg</button></li>`).join('');

    box.innerHTML = `${demo}${userBar}${form}
      <div id="tourReveal" class="reveal-box" hidden></div>
      <div class="panel"><h3>Twoje turnieje</h3>${history ? `<ul class="history">${history}</ul>` : '<p class="muted">Pusto. Jak w twoim banku po AH.</p>'}</div>`;

    $('#logoutBtn').addEventListener('click', () => api.logout());
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
      actions(el) {
        el.innerHTML = '<a class="btn" href="#kalendarz">Zobacz kalendarz</a>';
      }
    });
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openWarning() {
    if (!state.selectedDate) { toast('Wybierz dzień.', true); return; }
    const dlg = $('#warnDialog');
    $('#warnWhat').innerHTML = `${I.faction(state.faction)}<span><b>${esc(B.FACTION_PL[state.faction])}</b> · ${esc(fmtDate(state.selectedDate, { weekday: 'long', year: 'numeric' }))}</span>`;
    $('#warnCheck').checked = false;
    $('#warnGo').disabled = true;
    S.play('stamp');
    dlg.showModal();
  }

  async function confirmStart() {
    const dlg = $('#warnDialog');
    const go = $('#warnGo');
    go.disabled = true;
    go.textContent = 'Los się ładuje…';
    try {
      const entry = await api.start(state.faction, state.selectedDate);
      dlg.close();
      state.entries = await api.listEntries();
      renderTournament();
      renderCalendar();
      renderPlayers();
      const fresh = state.entries.find(e => e.id === entry.id) || entry;
      showTourReveal(fresh);
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
    const rasy = (r.stage1 || []).map((x, i) => `<span class="pill">${SLOT[i]}: <span class="mini">${I.race(x.winner)}</span>${esc(raceName(x.winner))}</span>`).join('');
    const combos = (r.stage2 || []).map((x, i) => `<span class="pill">${i + 1}: ${comboChip(x.race, x.winner)}</span>`).join('');
    const seq = r.final ? r.final.sequence.map(s => `<span class="logchip">${s + 1}</span>`).join('') : '';
    return `<article class="entry">
      <header>${avatar(e.user_name, e.avatar_url, 36)}<b>${esc(e.user_name)}</b><span class="mini fac">${I.faction(e.faction)}</span><span class="muted small">${esc(B.FACTION_PL[e.faction] || e.faction)}</span></header>
      <div class="entry-win">${comboChip(e.winner_race, e.winner_class)}<span class="muted small">finał ${fin}</span></div>
      <details><summary>Przebieg</summary>
        <p class="small"><b>Rasy:</b> ${rasy}</p>
        <p class="small"><b>Combo:</b> ${combos}</p>
        <p class="small"><b>Finał (kolejne trafienia):</b> ${seq}</p>
      </details>
      ${state.admin ? `<button type="button" class="btn btn-ghost btn-sm btn-del" data-del="${esc(e.id)}">Usuń wpis (admin)</button>` : ''}
    </article>`;
  }

  function renderCalendar() {
    const today = B.todayWarsaw();
    const byDay = {};
    state.entries.forEach(e => { (byDay[e.t_date] = byDay[e.t_date] || []).push(e); });
    const grid = monthGrid(eventDays(), d => {
      const list = byDay[d] || [];
      const av = list.slice(0, 4).map(e => avatar(e.user_name, e.avatar_url, 20)).join('');
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
      det.innerHTML = `<p class="muted">Kliknij dzień, żeby zobaczyć, kto co wylosował. Do tej pory: <b>${total}</b> ${total === 1 ? 'turniej' : 'turniejów'}.</p>`;
      return;
    }
    const list = byDay[state.calDay] || [];
    det.innerHTML = `<h3>${esc(fmtDate(state.calDay, { weekday: 'long', year: 'numeric' }))}</h3>` +
      (list.length ? `<div class="entries">${list.map(entryCard).join('')}</div>` : '<p class="muted">Nikt nic. Cisza jak na wipe’ie.</p>');
    $$('[data-del]', det).forEach(b => b.addEventListener('click', async () => {
      if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Kliknij jeszcze raz, żeby usunąć'; return; }
      try { await api.deleteEntry(b.dataset.del); state.entries = await api.listEntries(); renderAll(); toast('Wpis usunięty.'); }
      catch (e) { toast(e.message, true); }
    }));
  }

  /* ---------- gracze i top 3 ---------- */

  function renderPlayers() {
    const users = {};
    state.entries.forEach(e => {
      const u = users[e.user_id] = users[e.user_id] || { name: e.user_name, avatar: e.avatar_url, n: 0, combos: {}, last: '' };
      if (e.created_at >= u.last) { u.last = e.created_at; u.name = e.user_name; u.avatar = e.avatar_url; }
      u.n++;
      const k = e.winner_race + '|' + e.winner_class;
      const c = u.combos[k] = u.combos[k] || { race: e.winner_race, cls: e.winner_class, n: 0, last: '' };
      c.n++; if (e.t_date > c.last) c.last = e.t_date;
    });
    const list = Object.values(users).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
    if (!list.length) { $('#playersBody').innerHTML = '<p class="muted">Nikt jeszcze nie zagrał. Bądź pierwszy, zgarnij chwałę.</p>'; return; }
    const medals = ['gold', 'silver', 'bronze'];
    $('#playersBody').innerHTML = `<div class="players">${list.map(u => {
      const top = Object.values(u.combos).sort((a, b) => b.n - a.n || b.last.localeCompare(a.last)).slice(0, 3);
      return `<article class="player">
        <header>${avatar(u.name, u.avatar, 44)}<div><b>${esc(u.name)}</b><span class="muted small">${u.n} ${u.n === 1 ? 'turniej' : 'turniejów'}</span></div></header>
        <ol class="top3">${top.map((c, i) => `<li><span class="medal ${medals[i]}">${i + 1}</span>${comboChip(c.race, c.cls)}<span class="cnt">×${c.n}</span></li>`).join('')}</ol>
      </article>`;
    }).join('')}</div>`;
  }

  /* ---------- nawigacja i start ---------- */

  function route() {
    const id = (location.hash || '#random').slice(1);
    const known = ['random', 'turniej', 'kalendarz', 'gracze'];
    const cur = known.includes(id) ? id : 'random';
    known.forEach(k => { $('#sec-' + k).hidden = k !== cur; });
    $$('.nav a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + cur ? 'page' : 'false'));
  }

  function renderAll() { renderTournament(); renderCalendar(); renderPlayers(); }

  async function boot() {
    renderPhotos();
    setupToggles();
    setupRandomizer();
    window.addEventListener('hashchange', route);
    route();
    $('#deadlineTxt').textContent = fmtDate(cfg.EVENT_END, { year: 'numeric' });
    $('#warnCheck').addEventListener('change', e => { $('#warnGo').disabled = !e.target.checked; });
    $('#warnCancel').addEventListener('click', () => $('#warnDialog').close());
    $('#warnGo').addEventListener('click', confirmStart);

    api.onAuthChange(async u => {
      state.user = u;
      state.admin = u ? await api.isAdmin() : false;
      renderAll();
    });
    try {
      state.user = await api.getUser();
      state.admin = state.user ? await api.isAdmin() : false;
      state.entries = await api.listEntries();
    } catch (e) {
      toast('Nie udało się pobrać wyników: ' + e.message, true);
    }
    renderAll();
  }

  boot();
})();
