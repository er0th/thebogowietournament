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

  // Skład gildii, w tej kolejności na ekranie wyboru profilu.
  // photo = zdjęcie, art = rysunek zastępczy (soon, onion, void, knaga), tag = podpis, aliases = inne nicki.
  PLAYERS: [
    { nick: 'Bartas', photo: 'img/bartas.jpg', tag: 'Bartek i Druid' },
    { nick: 'Zdzichuj', aliases: ['Adam'], photo: 'img/zdzichuj.jpg', tag: 'aka Adam' },
    { nick: 'Eroth', photo: 'img/eroth.jpg', tag: 'ten od strony' },
    { nick: 'Fintek', art: 'soon', tag: 'fotka w drodze' },
    { nick: 'VenQ', photo: 'img/venq.jpg', tag: 'pokaż stópki' },
    { nick: 'Hazeg', photo: 'img/hazeg.jpg', tag: 'śpi na raidzie' },
    { nick: 'Cebulka', photo: 'img/cebulka.jpg', tag: 'ma warstwy jak ogr' },
    { nick: 'Eerion', art: 'void', tag: 'pustka' },
    { nick: 'Patryś', art: 'knaga', tag: 'wielka knaga' }
  ],

  // Własne dźwięki zamiast syntezatora.
  // Nazwy: tick, flip, drum, stamp, sad, howl, heartbeat, boom, crown, win, druid.
  SFX: {
    druid: 'sfx/bartek-i-druid.mp3'
  }
};
