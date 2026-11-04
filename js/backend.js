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
    const CKEY = 'bogowie:demo:characters';
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
      },
      async listCharacters() { try { return JSON.parse(localStorage.getItem(CKEY)) || []; } catch (e) { return []; } },
      async saveCharacter(c) {
        let list = await this.listCharacters();
        list = list.filter(x => !(nickKey(x.nick) === nickKey(c.nick) && x.slot === c.slot));
        if (c.race_id || c.class || c.name) {
          if (!B.RACE_BY_ID[c.race_id] || !B.RACE_BY_ID[c.race_id].classes.includes(c.class)) throw new Error('Ta rasa nie gra tą klasą w WoW: Forever.');
          list.push(Object.assign({}, c, { updated_at: new Date().toISOString() }));
        }
        try { localStorage.setItem(CKEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
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
      },
      async listCharacters() {
        const { data, error } = await sb.from('characters').select('nick,slot,name,race_id,class,prof1,prof2,updated_at');
        fail(error);
        return data || [];
      },
      async saveCharacter(c) {
        const { error } = await sb.rpc('save_character', {
          p_nick: c.nick, p_slot: c.slot, p_name: c.name || '', p_race: c.race_id || '', p_class: c.class || '',
          p_prof1: c.prof1 || null, p_prof2: c.prof2 || null
        });
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
