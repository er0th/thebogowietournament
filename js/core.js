/* TheBogowieTournament — roster i logika losowania (wersja przeglądarkowa).
   Ta sama logika jest w supabase/schema.sql (wersja serwerowa dla trybu turniejowego).
   Roster: oficjalna tabela ras i klas WoW: Forever (Blizzard, wrzesień 2026). */
(function () {
  'use strict';

  const CLASSES = ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'];

  const CLASS_COLORS = {
    Druid: '#FF7C0A', Hunter: '#AAD372', Mage: '#3FC7EB', Paladin: '#F48CBA', Priest: '#FFFFFF',
    Rogue: '#FFF468', Shaman: '#0070DD', Warlock: '#8788EE', Warrior: '#C69B6D'
  };

  const RACES = [
    { id: 'orc', name: 'Orc', faction: 'Horde', classes: ['Hunter', 'Mage', 'Rogue', 'Shaman', 'Warlock', 'Warrior'] },
    { id: 'undead', name: 'Undead', faction: 'Horde', classes: ['Mage', 'Paladin', 'Priest', 'Rogue', 'Warlock', 'Warrior'] },
    { id: 'tauren', name: 'Tauren', faction: 'Horde', classes: ['Druid', 'Hunter', 'Shaman', 'Warrior'] },
    { id: 'troll', name: 'Troll', faction: 'Horde', classes: ['Hunter', 'Mage', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'] },
    { id: 'windshaper', name: 'Windshaper Skyborne', faction: 'Horde', classes: ['Druid', 'Hunter', 'Rogue', 'Shaman', 'Warrior'] },
    { id: 'human', name: 'Human', faction: 'Alliance', classes: ['Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Warlock', 'Warrior'] },
    { id: 'dwarf', name: 'Dwarf', faction: 'Alliance', classes: ['Hunter', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warrior'] },
    { id: 'nightelf', name: 'Night Elf', faction: 'Alliance', classes: ['Druid', 'Hunter', 'Priest', 'Rogue', 'Warrior'] },
    { id: 'gnome', name: 'Gnome', faction: 'Alliance', classes: ['Mage', 'Priest', 'Rogue', 'Warlock', 'Warrior'] },
    { id: 'highorder', name: 'High Order Skyborne', faction: 'Alliance', classes: ['Druid', 'Hunter', 'Mage', 'Rogue', 'Warrior'] }
  ];
  const RACE_BY_ID = Object.fromEntries(RACES.map(r => [r.id, r]));

  const RACE_MEMES = {
    orc: 'Zielony, wkurwiony, gotowy do bitki. Zug zug.',
    undead: 'Gnije od lat, a i tak gra więcej niż ty.',
    tauren: 'Muuu. Hitbox jak stodoła, mózg jak u krowy.',
    troll: 'Hej ziomuś, regen na pełnej, mózg na zero.',
    windshaper: 'Pierzasty pojeb z wiatrem w dupie.',
    human: 'Najnudniejszy wybór świata. Gratulacje, kurwa.',
    dwarf: 'Broda większa niż twój DPS, browar większy niż wątroba.',
    nightelf: 'Znika, jak trzeba płacić za piwo.',
    gnome: 'Metr w kapeluszu, a wkurwia za trzech.',
    highorder: 'Ptak, ale z klasą. Sra tylko na biedotę.'
  };

  const CLASS_MEMES = {
    Druid: 'Kot, miś, drzewo, ptak — zdecyduj się w końcu, kurwa.',
    Hunter: 'Pet robi całą robotę, ty zbierasz pochwały.',
    Mage: 'Woda i chlebek dla całej gildii. Kelner z różdżką.',
    Paladin: 'Bąbelek, hearth, chuj z wami.',
    Priest: 'Leczysz wszystkich, nikt nie dziękuje. Witaj w życiu.',
    Rogue: 'Wbija nóż w plecy i znika z odpowiedzialnością.',
    Shaman: 'Totemy, totemy, wszędzie jebane totemy.',
    Warlock: 'Duszyczki do torby, pet do roboty, moralność do kosza.',
    Warrior: 'Drze mordę i napierdala. Proste jak cep.'
  };

  const FACTION_PL = { Horde: 'Horda', Alliance: 'Przymierze' };

  // Kryptograficzna losowość + odrzucanie, żeby uniknąć faworyzowania przez modulo.
  function randInt(n) {
    if (!Number.isInteger(n) || n < 1) throw new Error('Zły zakres losowania');
    const limit = Math.floor(4294967296 / n) * n;
    const buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }

  function shuffle(values) {
    const a = values.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Jedno losowanie: do 5 kandydatów → 3 przechodzą → 1 wygrywa.
  function drawRound(pool) {
    const contenders = shuffle(pool).slice(0, Math.min(5, pool.length));
    const advancing = shuffle(contenders).slice(0, 3);
    const winner = advancing[randInt(advancing.length)];
    return { contenders, advancing, winner };
  }

  function racesOf(faction) {
    return RACES.filter(r => r.faction === faction);
  }

  function classesOf(faction) {
    const races = racesOf(faction);
    return CLASSES.filter(cls => races.some(r => r.classes.includes(cls)));
  }

  // Cały turniej: 3× wybór klasy, 3× wybór rasy dla tej klasy, finał do `target` trafień.
  // Najpierw klasa, bo wtedy każda klasa ma równe szanse (Warrior nie dominuje).
  function runTournament(faction, target) {
    if (!FACTION_PL[faction]) throw new Error('Wybierz frakcję');
    target = target || 4;
    const stage1 = [0, 1, 2].map(() => drawRound(classesOf(faction)));
    const stage2 = stage1.map(r => Object.assign({ cls: r.winner },
      drawRound(racesOf(faction).filter(x => x.classes.includes(r.winner)).map(x => x.id))));
    const counts = [0, 0, 0];
    const sequence = [];
    let pick;
    do {
      pick = randInt(3);
      sequence.push(pick);
      counts[pick]++;
    } while (counts[pick] < target);
    return { order: 'class', faction, stage1, stage2, final: { sequence, target, winnerSlot: pick } };
  }

  // Trzy combo z etapu 2. Obsługuje też stare wpisy losowane w kolejności rasa → klasa.
  function combosOf(result) {
    return result.stage2.map(r => result.order === 'class' ? { race: r.winner, cls: r.cls } : { race: r.race, cls: r.winner });
  }

  function winnerOf(result) {
    return combosOf(result)[result.final.winnerSlot];
  }

  function comboLabel(raceId, cls) {
    return (RACE_BY_ID[raceId] ? RACE_BY_ID[raceId].name : raceId) + ' ' + cls;
  }

  window.Bogowie = window.Bogowie || {};
  Object.assign(window.Bogowie, {
    CLASSES, CLASS_COLORS, RACES, RACE_BY_ID, RACE_MEMES, CLASS_MEMES, FACTION_PL,
    randInt, shuffle, drawRound, racesOf, classesOf, runTournament, combosOf, winnerOf, comboLabel
  });
})();
