/* TheBogowieTournament — dane turniejowe.
   Logowania nie ma: gracz wpisuje nick. Wyniki trzyma Supabase, a bez konfiguracji
   działa tryb DEMO w localStorage tej przeglądarki. */
(function () {
  'use strict';
  const B = window.Bogowie;
  const cfg = window.BOGOWIE_CONFIG || {};

  function todayWarsaw() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  }

  // Nick: 2–24 znaki, litery (też polskie), cyfry, spacja, _ - .
  function cleanNick(raw) {
    const nick = String(raw || '').replace(/\s+/g, ' ').trim();
    if (nick.length < 2 || nick.length > 24) throw new Error('Nick ma mieć od 2 do 24 znaków.');
    if (!/^[\p{L}\p{N} _.\-]+$/u.test(nick)) throw new Error('W nicku tylko litery, cyfry, spacja, _ - .');
    return nick;
  }
  const nickKey = n => String(n || '').trim().toLowerCase();

  function validate(nick, date, entries) {
    const today = todayWarsaw();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('Wybierz dzień.');
    if (date > today) throw new Error('W przyszłość się nie gra, cwaniaku.');
    if (date < cfg.EVENT_START || date > cfg.EVENT_END) throw new Error('Ten dzień jest poza eventem.');
    if (entries.some(e => nickKey(e.nick) === nickKey(nick) && e.t_date === date)) throw new Error(`${nick} ma już wpis na ten dzień.`);
  }

  function demoBackend() {
    const KEY = 'bogowie:demo:entries';
    const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
    const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* ignore */ } };
    const mask = e => (e.revealed ? e : Object.assign({}, e, { result: null, winner_race: null, winner_class: null }));
    return {
      mode: 'demo',
      async listEntries() { return read().map(e => mask(e)).map(({ reveal_token, ...rest }) => rest); },
      async start(rawNick, faction, date) {
        const nick = cleanNick(rawNick);
        const entries = read();
        validate(nick, date, entries);
        const result = B.runTournament(faction, cfg.FINAL_TARGET);
        const w = B.winnerOf(result);
        const entry = {
          id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
          nick, faction, t_date: date, result, winner_race: w.race, winner_class: w.cls,
          created_at: new Date().toISOString(), revealed: false,
          reveal_token: (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()))
        };
        entries.push(entry);
        write(entries);
        return entry;
      },
      async reveal(id, token) {
        write(read().map(e => (e.id === id && e.reveal_token === token ? Object.assign(e, { revealed: true }) : e)));
      }
    };
  }

  function supabaseBackend() {
    const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const fail = error => { if (error) throw new Error(error.message || 'Coś się wyjebało po stronie serwera.'); };
    return {
      mode: 'supabase',
      async listEntries() {
        const { data, error } = await sb.from('entries_public')
          .select('id,nick,faction,t_date,result,winner_race,winner_class,created_at,revealed')
          .order('t_date', { ascending: true }).order('created_at', { ascending: true });
        fail(error);
        return data || [];
      },
      async start(rawNick, faction, date) {
        const nick = cleanNick(rawNick);
        const { data, error } = await sb.rpc('start_tournament', { p_nick: nick, p_faction: faction, p_date: date });
        fail(error);
        return Array.isArray(data) ? data[0] : data;
      },
      async reveal(id, token) {
        const { error } = await sb.rpc('reveal_entry', { p_id: id, p_token: token });
        fail(error);
      }
    };
  }

  const configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  B.todayWarsaw = todayWarsaw;
  B.cleanNick = cleanNick;
  B.nickKey = nickKey;
  B.backend = configured ? supabaseBackend() : demoBackend();
})();
