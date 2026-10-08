/* TheBogowieTournament — dane turniejowe.
   Supabase (logowanie Discord + wspólna baza), a bez konfiguracji: tryb DEMO w localStorage. */
(function () {
  'use strict';
  const B = window.Bogowie;
  const cfg = window.BOGOWIE_CONFIG || {};

  function todayWarsaw() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  }

  function validateDate(date, entries, userId) {
    const today = todayWarsaw();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('Wybierz datę.');
    if (date > today) throw new Error('Nie da się grać w przyszłości. Jeszcze.');
    if (date < cfg.EVENT_START || date > cfg.EVENT_END) throw new Error('Ta data jest poza eventem.');
    if (entries.some(e => e.user_id === userId && e.t_date === date)) throw new Error('Masz już wpis na ten dzień.');
  }

  function demoBackend() {
    const KEY_E = 'bogowie:demo:entries', KEY_U = 'bogowie:demo:user';
    const listeners = [];
    const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
    const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
    const emit = () => listeners.forEach(cb => cb(read(KEY_U, null)));
    return {
      mode: 'demo',
      async getUser() { return read(KEY_U, null); },
      async login(rawName) {
        const name = String(rawName || '').trim().slice(0, 32);
        if (!name) throw new Error('Wpisz jakiś nick.');
        write(KEY_U, { id: 'demo-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, avatar: null });
        emit();
      },
      async logout() { try { localStorage.removeItem(KEY_U); } catch (e) { /* ignore */ } emit(); },
      onAuthChange(cb) { listeners.push(cb); },
      async listEntries() { return read(KEY_E, []); },
      async start(faction, date) {
        const user = read(KEY_U, null);
        if (!user) throw new Error('Najpierw się zaloguj.');
        const entries = read(KEY_E, []);
        validateDate(date, entries, user.id);
        const result = B.runTournament(faction, cfg.FINAL_TARGET);
        const w = B.winnerOf(result);
        const entry = {
          id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
          user_id: user.id, user_name: user.name, avatar_url: null, faction, t_date: date,
          result, winner_race: w.race, winner_class: w.cls, created_at: new Date().toISOString()
        };
        entries.push(entry);
        write(KEY_E, entries);
        return entry;
      },
      async isAdmin() { return true; },
      async deleteEntry(id) { write(KEY_E, read(KEY_E, []).filter(e => e.id !== id)); }
    };
  }

  function supabaseBackend() {
    const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    const mapUser = u => {
      if (!u) return null;
      const m = u.user_metadata || {};
      return {
        id: u.id,
        name: (m.custom_claims && m.custom_claims.global_name) || m.full_name || m.name || 'Anonim',
        avatar: m.avatar_url || null
      };
    };
    const fail = (error) => { if (error) throw new Error(error.message || 'Coś się wysypało.'); };
    return {
      mode: 'supabase',
      async getUser() {
        const { data } = await sb.auth.getSession();
        return mapUser(data && data.session && data.session.user);
      },
      async login() {
        const { error } = await sb.auth.signInWithOAuth({
          provider: 'discord',
          options: { redirectTo: location.origin + location.pathname + '#turniej' }
        });
        fail(error);
      },
      async logout() { await sb.auth.signOut(); },
      onAuthChange(cb) { sb.auth.onAuthStateChange((_e, s) => cb(mapUser(s && s.user))); },
      async listEntries() {
        const { data, error } = await sb.from('tournaments')
          .select('id,user_id,user_name,avatar_url,faction,t_date,result,winner_race,winner_class,created_at')
          .order('t_date', { ascending: true }).order('created_at', { ascending: true });
        fail(error);
        return data || [];
      },
      async start(faction, date) {
        const { data, error } = await sb.rpc('start_tournament', { p_faction: faction, p_date: date });
        fail(error);
        return Array.isArray(data) ? data[0] : data;
      },
      async isAdmin() {
        const { data, error } = await sb.rpc('is_admin');
        if (error) return false;
        return !!data;
      },
      async deleteEntry(id) {
        const { error } = await sb.rpc('admin_delete_tournament', { p_id: id });
        fail(error);
      }
    };
  }

  const configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  B.todayWarsaw = todayWarsaw;
  B.backend = configured ? supabaseBackend() : demoBackend();
})();
