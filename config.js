/* TheBogowieTournament — ustawienia.
   Dopóki SUPABASE_URL i SUPABASE_ANON_KEY są puste, tryb turniejowy działa jako DEMO
   (wpisy tylko w tej przeglądarce). Klucz "anon" jest publiczny z założenia, można go tu wpisać. */
window.BOGOWIE_CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  // Okno eventu (czas polski). Muszą się zgadzać z supabase/schema.sql.
  EVENT_START: '2026-10-08',
  EVENT_END: '2026-11-03',

  // Finał Bo7: wygrywa combo, które pierwsze trafi tyle razy. Musi się zgadzać z schema.sql.
  FINAL_TARGET: 4,

  // Wasze zdjęcia do nagłówka, np. ['img/ekipa1.jpg', 'img/ekipa2.jpg', 'img/ekipa3.jpg']
  PHOTOS: [],

  // Własne dźwięki zamiast syntezatora. Nazwy: tick, flip, drum, stamp, sad, howl, heartbeat, boom, crown, win.
  // Przykład: { win: 'sfx/win.mp3', sad: 'sfx/trombone.mp3' }
  SFX: {}
};
