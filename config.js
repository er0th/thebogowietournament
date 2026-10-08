/* TheBogowieTournament — ustawienia.
   Dopóki SUPABASE_URL i SUPABASE_ANON_KEY są puste, tryb turniejowy działa jako DEMO
   (wpisy tylko w tej przeglądarce). Klucz publiczny (publishable / anon) można tu wpisać. */
window.BOGOWIE_CONFIG = {
  SUPABASE_URL: 'https://oitzaipjhzbmvijngorp.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_kjk79GonWnCWaiyJTJS3hw_yz08AkCJ',

  // Okno eventu (czas polski). Muszą się zgadzać z supabase/schema.sql.
  EVENT_START: '2026-10-08',
  EVENT_END: '2026-11-03',

  // Finał Bo7: wygrywa combo, które pierwsze trafi tyle razy. Musi się zgadzać z schema.sql.
  FINAL_TARGET: 4,

  // Skład gildii, w tej kolejności na ekranie wyboru profilu.
  // photo = zdjęcie, art = rysunek zastępczy (soon, onion, void, knaga, clover), tag = podpis, aliases = inne nicki.
  PLAYERS: [
    { nick: 'Bartas', aliases: ['Hefek'], photo: 'img/bartas.jpg', tag: 'aka Hefek' },
    { nick: 'Zdzichuj', aliases: ['Adam'], photo: 'img/zdzichuj.jpg', tag: 'aka Adam' },
    { nick: 'Eroth', photo: 'img/eroth.jpg', tag: 'ten od strony' },
    { nick: 'Fintek', photo: 'img/fintek.jpg', tag: 'The BÓG' },
    { nick: 'VenQ', photo: 'img/venq.jpg', tag: 'pokaż stópki' },
    { nick: 'Hazeg', photo: 'img/hazeg.jpg', tag: 'śpi na raidzie' },
    { nick: 'Cebulka', photo: 'img/cebulka.jpg', tag: 'ma warstwy jak ogr' },
    { nick: 'Eerion', art: 'void', tag: 'pustka' },
    { nick: 'Patryś', art: 'knaga', tag: 'wielka knaga' },
    { nick: 'Torrac', art: 'clover', tag: 'farciarz jebany' }
  ],

  // Dźwięki. Lista w [ ] = losuje jeden z kilku. Bez wpisu gra syntezator albo nic.
  // Ogólne: tick, flip, drum, stamp, sad, howl, heartbeat, boom, crown, win,
  //   final (po wygraniu Bo7), matchpoint (meczbol), readycheck (start turnieju).
  // Głosy: 'race:<id>', 'class:<Klasa>', 'combo:<rasa>|<Klasa>' (ma pierwszeństwo przed klasą),
  //   'player:<Nick>' (po kliknięciu profilu). Id ras: orc, undead, tauren, troll, windshaper,
  //   human, dwarf, nightelf, gnome, highorder.
  SFX: {
    win: 'sfx/levelup.mp3',
    final: ['sfx/final1.mp3', 'sfx/final2.mp3', 'sfx/final3.mp3', 'sfx/final4.mp3', 'sfx/final5.mp3', 'sfx/final6.mp3', 'sfx/final8.mp3'],
    matchpoint: 'sfx/maczbol1.mp3',
    readycheck: ['sfx/readycheck.mp3', 'sfx/readycheck2.mp3'],

    'player:Bartas': 'sfx/bartas.mp3',
    'player:Zdzichuj': 'sfx/zdzichuj.mp3',
    'player:Fintek': ['sfx/fintek.mp3', 'sfx/fintek2.mp3'],
    'player:VenQ': 'sfx/venq.mp3',
    'player:Cebulka': 'sfx/cebulka.mp3',
    'player:Hazeg': 'sfx/hazeg.mp3',
    'player:Eroth': 'sfx/eroth.mp3',
    'player:Eerion': 'sfx/eerion.mp3',

    'race:dwarf': 'sfx/dwarf1.mp3',

    'class:Druid': ['sfx/druid2.mp3', 'sfx/druid3.mp3', 'sfx/feraldruid1.mp3'],
    'class:Hunter': ['sfx/hunter1.mp3', 'sfx/hunter2.mp3'],
    'class:Mage': 'sfx/mage1.mp3',
    'class:Paladin': 'sfx/paladin1.mp3',
    'class:Priest': ['sfx/priest1.mp3', 'sfx/priest2.mp3', 'sfx/priest3.mp3'],
    'class:Rogue': ['sfx/rogue1.mp3', 'sfx/rogue2.mp3'],
    'class:Shaman': 'sfx/shaman1.mp3',
    'class:Warlock': ['sfx/warlock1.mp3', 'sfx/warlock2.mp3'],
    'class:Warrior': 'sfx/warrior1.mp3',

    'combo:gnome|Mage': 'sfx/gnomemage1.mp3',
    'combo:tauren|Warrior': ['sfx/warriortauren1.mp3', 'sfx/warriortauren2.mp3']
  }
};
