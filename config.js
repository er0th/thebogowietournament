/* TheBogowieTournament — ustawienia.
   Dopóki SUPABASE_URL i SUPABASE_ANON_KEY są puste, tryb turniejowy działa jako DEMO
   (wpisy tylko w tej przeglądarce). Klucz publiczny (publishable / anon) można tu wpisać. */
window.BOGOWIE_CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  // Okno eventu (czas polski). Muszą się zgadzać z supabase/schema.sql.
  EVENT_START: '2026-10-08',
  EVENT_END: '2026-11-03',

  // Finał Bo7: wygrywa combo, które pierwsze trafi tyle razy. Musi się zgadzać z schema.sql.
  FINAL_TARGET: 4,

  // Skład gildii. photo = zdjęcie przy nicku, aliases = inne nicki tej samej osoby.
  PLAYERS: [
    { nick: 'Bartas', photo: 'img/bartas.jpg' },
    { nick: 'Zdzichuj', aliases: ['Adam'] },
    { nick: 'Eroth' },
    { nick: 'Fintek' },
    { nick: 'Hazeg' }
  ],

  // Polaroidy w nagłówku.
  PHOTOS: [
    { src: 'img/gracz-a.jpg', caption: 'raid leader po godzinach' },
    { src: 'img/gracz-b.jpg', caption: 'jeszcze jeden dungeon i spać' },
    { src: 'img/bartas.jpg', caption: 'Bartek w szczytowej formie' },
    { src: 'img/gracz-c.jpg', caption: 'po piątym monsterze' },
    { src: 'img/gracz-d.jpg', caption: 'właśnie wylosował Gnoma' }
  ],

  // Własne dźwięki zamiast syntezatora.
  // Nazwy: tick, flip, drum, stamp, sad, howl, heartbeat, boom, crown, win, druid.
  SFX: {
    druid: 'sfx/bartek-i-druid.mp3'
  }
};
