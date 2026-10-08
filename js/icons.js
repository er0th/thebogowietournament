/* TheBogowieTournament — własne, memiczne ikony (SVG). Do podmiany, kiedy chcesz. */
(function () {
  'use strict';
  const K = '#1b1512';
  const wrap = (inner, label) =>
    `<svg class="ico" viewBox="0 0 64 64" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">${inner}</svg>`;
  const eye = (x, y, r = 2.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${K}"/>`;

  const SHIELD = 'M8 10 H56 V34 C56 48 44 56 32 61 C20 56 8 48 8 34 Z';

  const FACTIONS = {
    Horde: `
      <path d="${SHIELD}" fill="#b3202a" stroke="${K}" stroke-width="3"/>
      <path d="M16 22 L28 28 M48 22 L36 28" stroke="${K}" stroke-width="4"/>
      ${eye(24, 32)}${eye(40, 32)}
      <path d="M21 46 Q32 38 43 46" fill="none" stroke="${K}" stroke-width="3"/>
      <path d="M23 45 L25.5 34 L29 43 Z M35 43 L38.5 34 L41 45 Z" fill="#fff" stroke="${K}" stroke-width="2"/>`,
    Alliance: `
      <path d="${SHIELD}" fill="#2350b8" stroke="${K}" stroke-width="3"/>
      <path d="M19 31 Q24 27 29 31 M35 31 Q40 27 45 31" fill="none" stroke="${K}" stroke-width="3"/>
      <circle cx="40" cy="31" r="6" fill="none" stroke="#f2c230" stroke-width="2.4"/>
      <path d="M46 33 Q50 41 47 50" fill="none" stroke="#f2c230" stroke-width="1.8"/>
      <path d="M23 43 Q33 48 42 40" fill="none" stroke="${K}" stroke-width="3"/>
      <path d="M19 14 L23 4 L28 11 L32 2 L36 11 L41 4 L45 14 Z" fill="#f2c230" stroke="${K}" stroke-width="2.4"/>`
  };

  const RACES = {
    orc: `
      <path d="M12 30 L4 24 L12 38 Z M52 30 L60 24 L52 38 Z" fill="#5b9446" stroke="${K}" stroke-width="2.2"/>
      <circle cx="32" cy="35" r="21" fill="#6aa84f" stroke="${K}" stroke-width="3"/>
      <ellipse cx="32" cy="12" rx="6" ry="5" fill="${K}"/>
      <path d="M18 26 L29 30 M46 26 L35 30" stroke="${K}" stroke-width="4"/>
      ${eye(24, 34)}${eye(40, 34)}
      <path d="M22 47 H42" stroke="${K}" stroke-width="3"/>
      <path d="M23 47 L24 38 L28 47 Z M36 47 L40 38 L41 47 Z" fill="#fffbe9" stroke="${K}" stroke-width="2"/>`,
    undead: `
      <circle cx="32" cy="34" r="21" fill="#b7c4a8" stroke="${K}" stroke-width="3"/>
      <path d="M38 14 L35 20 L39 23" fill="none" stroke="${K}" stroke-width="2"/>
      <path d="M19 27 L27 35 M27 27 L19 35" stroke="${K}" stroke-width="3"/>
      <circle cx="41" cy="31" r="6" fill="#fff" stroke="${K}" stroke-width="2.4"/>${eye(42, 32, 1.8)}
      <path d="M20 46 H44" stroke="${K}" stroke-width="2.6"/>
      <path d="M24 43 V49 M29 43 V49 M34 43 V49 M39 43 V49" stroke="${K}" stroke-width="2"/>`,
    tauren: `
      <path d="M14 26 C4 22 4 10 10 4 C12 14 16 18 22 20 Z M50 26 C60 22 60 10 54 4 C52 14 48 18 42 20 Z" fill="#f4ead2" stroke="${K}" stroke-width="2.4"/>
      <ellipse cx="8" cy="32" rx="7" ry="4" fill="#7a4e33" stroke="${K}" stroke-width="2"/>
      <ellipse cx="56" cy="32" rx="7" ry="4" fill="#7a4e33" stroke="${K}" stroke-width="2"/>
      <ellipse cx="32" cy="34" rx="20" ry="22" fill="#8a5a3b" stroke="${K}" stroke-width="3"/>
      ${eye(24, 28)}${eye(40, 28)}
      <ellipse cx="32" cy="45" rx="12" ry="8" fill="#e9a3a0" stroke="${K}" stroke-width="2.4"/>
      ${eye(27, 45, 1.8)}${eye(37, 45, 1.8)}
      <circle cx="32" cy="54" r="4.5" fill="none" stroke="#f2c230" stroke-width="2.6"/>`,
    troll: `
      <path d="M14 32 L1 22 L16 40 Z M50 32 L63 22 L48 40 Z" fill="#4f9fc7" stroke="${K}" stroke-width="2.2"/>
      <circle cx="32" cy="36" r="19" fill="#4f9fc7" stroke="${K}" stroke-width="3"/>
      <path d="M24 18 L26 6 L30 16 L32 3 L35 16 L39 6 L40 18 Z" fill="#e0412f" stroke="${K}" stroke-width="2.2"/>
      <circle cx="25" cy="33" r="3.4" fill="#ffe36b" stroke="${K}" stroke-width="1.6"/>
      <circle cx="39" cy="33" r="3.4" fill="#ffe36b" stroke="${K}" stroke-width="1.6"/>
      <path d="M22 46 Q32 53 42 46" fill="none" stroke="${K}" stroke-width="3"/>
      <path d="M21 47 L17 33 L25 46 Z M43 47 L47 33 L39 46 Z" fill="#fffbe9" stroke="${K}" stroke-width="2"/>`,
    windshaper: `
      <path d="M26 16 L22 4 L30 13 L32 2 L35 13 L42 5 L38 16 Z" fill="#2c8a7f" stroke="${K}" stroke-width="2"/>
      <circle cx="32" cy="34" r="20" fill="#3fb6a8" stroke="${K}" stroke-width="3"/>
      ${eye(25, 30)}${eye(39, 30)}
      <path d="M25 38 H39 L32 50 Z" fill="#f2a33a" stroke="${K}" stroke-width="2.4"/>
      <path d="M50 20 Q60 18 58 26 Q56 30 52 28 M52 40 Q62 40 61 47" fill="none" stroke="#bfe9e4" stroke-width="2.6"/>`,
    human: `
      <circle cx="32" cy="35" r="20" fill="#f2c6a0" stroke="${K}" stroke-width="3"/>
      <path d="M13 31 C12 16 22 11 32 11 C44 11 52 18 51 31 C45 23 36 20 27 22 C21 23 16 26 13 31 Z" fill="#6b4226" stroke="${K}" stroke-width="2.4"/>
      ${eye(25, 33, 2.2)}${eye(39, 33, 2.2)}
      <path d="M20 44 Q26 39 32 43 Q38 39 44 44 Q38 47 32 45 Q26 47 20 44 Z" fill="#6b4226" stroke="${K}" stroke-width="2"/>
      <path d="M27 50 H37" stroke="${K}" stroke-width="2.4"/>`,
    dwarf: `
      <circle cx="32" cy="30" r="18" fill="#f2c6a0" stroke="${K}" stroke-width="3"/>
      <path d="M12 26 C12 10 52 10 52 26 Z" fill="#9aa1ad" stroke="${K}" stroke-width="2.6"/>
      <path d="M13 22 C6 18 6 10 10 6 C12 14 14 16 18 18 Z M51 22 C58 18 58 10 54 6 C52 14 50 16 46 18 Z" fill="#f4ead2" stroke="${K}" stroke-width="2"/>
      ${eye(25, 30, 2.2)}${eye(39, 30, 2.2)}
      <path d="M12 34 C14 52 22 62 32 62 C42 62 50 52 52 34 C46 40 40 38 32 40 C24 38 18 40 12 34 Z" fill="#e0742a" stroke="${K}" stroke-width="2.6"/>
      <ellipse cx="32" cy="38" rx="5" ry="4" fill="#e9a07a" stroke="${K}" stroke-width="2"/>
      <path d="M32 46 V58" stroke="#a84f17" stroke-width="2.4"/>`,
    nightelf: `
      <path d="M16 34 L4 6 L22 26 Z M48 34 L60 6 L42 26 Z" fill="#8c6cc2" stroke="${K}" stroke-width="2.2"/>
      <circle cx="32" cy="36" r="19" fill="#8c6cc2" stroke="${K}" stroke-width="3"/>
      <path d="M14 30 C16 18 26 15 32 17 C38 15 48 18 50 30 C44 24 38 24 32 25 C26 24 20 24 14 30 Z" fill="#2fb3a0" stroke="${K}" stroke-width="2"/>
      <path d="M19 29 L30 32 M45 29 L34 32" stroke="#e9f4ff" stroke-width="2"/>
      <circle cx="25" cy="36" r="3.4" fill="#d6fbff" stroke="${K}" stroke-width="1.4"/>
      <circle cx="39" cy="36" r="3.4" fill="#d6fbff" stroke="${K}" stroke-width="1.4"/>
      <path d="M28 47 Q32 49 36 47" fill="none" stroke="${K}" stroke-width="2.4"/>`,
    gnome: `
      <path d="M17 34 C6 30 6 22 10 18 C12 26 16 28 20 28 Z M47 34 C58 30 58 22 54 18 C52 26 48 28 44 28 Z" fill="#ff6fb5" stroke="${K}" stroke-width="2"/>
      <circle cx="32" cy="38" r="16" fill="#f2c6a0" stroke="${K}" stroke-width="3"/>
      <path d="M17 34 H47" stroke="#6d6d78" stroke-width="3"/>
      <circle cx="25" cy="34" r="6.5" fill="#9fd8f0" stroke="#4a4a55" stroke-width="2.6"/>
      <circle cx="39" cy="34" r="6.5" fill="#9fd8f0" stroke="#4a4a55" stroke-width="2.6"/>
      ${eye(25, 34, 1.8)}${eye(39, 34, 1.8)}
      <path d="M24 45 Q32 53 40 45 Z" fill="#fff" stroke="${K}" stroke-width="2.2"/>`,
    highorder: `
      <ellipse cx="32" cy="9" rx="15" ry="4.5" fill="none" stroke="#f2c230" stroke-width="3"/>
      <circle cx="32" cy="35" r="20" fill="#f3efe4" stroke="${K}" stroke-width="3"/>
      <path d="M21 30 Q25 27 29 30 M35 30 Q39 27 43 30" fill="none" stroke="${K}" stroke-width="2.6"/>
      <path d="M25 37 H39 L32 48 Z" fill="#f2c230" stroke="${K}" stroke-width="2.4"/>
      <path d="M52 16 L54 11 L56 16 L61 18 L56 20 L54 25 L52 20 L47 18 Z" fill="#f2c230" stroke="${K}" stroke-width="1.4"/>
      <path d="M24 56 L32 52 L40 56 L40 49 L32 53 L24 49 Z" fill="#7a2ea0" stroke="${K}" stroke-width="1.8"/>`
  };

  const CLASSES = {
    Druid: `
      <path d="M12 52 C12 26 32 10 54 10 C54 32 40 52 12 52 Z" fill="#7cc75c" stroke="${K}" stroke-width="3"/>
      <path d="M12 52 L44 20 M26 38 L24 28 M33 31 L41 33" stroke="#2f6b25" stroke-width="2.4"/>
      <circle cx="46" cy="46" r="4" fill="#FF7C0A" stroke="${K}" stroke-width="1.6"/>
      <circle cx="40" cy="53" r="2.4" fill="#FF7C0A" stroke="${K}" stroke-width="1.2"/><circle cx="52" cy="53" r="2.4" fill="#FF7C0A" stroke="${K}" stroke-width="1.2"/>`,
    Hunter: `
      <path d="M18 6 Q52 32 18 58" fill="none" stroke="#7a4e2a" stroke-width="5"/>
      <path d="M18 6 L18 58" stroke="${K}" stroke-width="1.6"/>
      <path d="M8 32 H52" stroke="${K}" stroke-width="3"/>
      <path d="M50 26 L60 32 L50 38 Z" fill="#AAD372" stroke="${K}" stroke-width="2"/>
      <path d="M8 32 L4 26 M8 32 L4 38 M13 32 L9 26 M13 32 L9 38" stroke="#e0412f" stroke-width="2.4"/>`,
    Mage: `
      <ellipse cx="32" cy="50" rx="26" ry="7" fill="#2a4aa8" stroke="${K}" stroke-width="2.6"/>
      <path d="M32 4 C36 18 44 34 48 48 H16 C20 34 26 18 32 4 Z" fill="#3a62c9" stroke="${K}" stroke-width="2.6"/>
      <path d="M30 22 L32 17 L34 22 L39 23 L35 26 L36 31 L32 28 L28 31 L29 26 L25 23 Z" fill="#ffe36b" stroke="${K}" stroke-width="1.4"/>
      <path d="M17 41 Q32 46 47 41" fill="none" stroke="#3FC7EB" stroke-width="3"/>
      <circle cx="54" cy="18" r="2" fill="#3FC7EB"/><circle cx="10" cy="26" r="1.6" fill="#3FC7EB"/>`,
    Paladin: `
      <circle cx="32" cy="32" r="28" fill="#f2c23026" stroke="#f2c230" stroke-width="2.4" stroke-dasharray="5 4"/>
      <rect x="16" y="12" width="32" height="16" rx="3" fill="#cfd0da" stroke="${K}" stroke-width="2.6"/>
      <rect x="29" y="28" width="6" height="26" rx="2" fill="#8a5a3b" stroke="${K}" stroke-width="2.2"/>
      <path d="M32 15 V25 M27 20 H37" stroke="#F48CBA" stroke-width="3"/>`,
    Priest: `
      <ellipse cx="32" cy="10" rx="14" ry="4.5" fill="none" stroke="#f2c230" stroke-width="3"/>
      <path d="M32 56 C14 44 8 34 12 26 C16 18 26 18 32 27 C38 18 48 18 52 26 C56 34 50 44 32 56 Z" fill="#ffffff" stroke="${K}" stroke-width="3"/>
      <path d="M32 31 V45 M25 38 H39" stroke="#f2c230" stroke-width="3.4"/>`,
    Rogue: `
      <path d="M8 16 Q32 8 56 16 L56 28 Q32 22 8 28 Z" fill="${K}"/>
      <ellipse cx="22" cy="20" rx="5" ry="3" fill="#FFF468"/><ellipse cx="42" cy="20" rx="5" ry="3" fill="#FFF468"/>
      <path d="M18 58 L22 54 L42 34 L50 30 L46 38 L26 58 Z" fill="#dfe3ea" stroke="${K}" stroke-width="2.4"/>
      <path d="M17 49 L27 59" stroke="${K}" stroke-width="3.4"/>
      <path d="M14 58 L19 53" stroke="#7a4e2a" stroke-width="4"/>`,
    Shaman: `
      <path d="M14 14 L4 8 L14 22 Z M50 14 L60 8 L50 22 Z" fill="#0070DD" stroke="${K}" stroke-width="2"/>
      <rect x="14" y="6" width="36" height="18" rx="3" fill="#e0742a" stroke="${K}" stroke-width="2.4"/>
      ${eye(25, 14, 2.2)}${eye(39, 14, 2.2)}<path d="M27 19 H37" stroke="${K}" stroke-width="2"/>
      <rect x="16" y="24" width="32" height="16" rx="3" fill="#0070DD" stroke="${K}" stroke-width="2.4"/>
      <path d="M22 30 L27 33 M42 30 L37 33 M26 36 Q32 32 38 36" fill="none" stroke="${K}" stroke-width="2"/>
      <rect x="18" y="40" width="28" height="18" rx="3" fill="#5b9446" stroke="${K}" stroke-width="2.4"/>
      ${eye(26, 47, 2)}${eye(38, 47, 2)}<ellipse cx="32" cy="53" rx="3" ry="2.4" fill="${K}"/>`,
    Warlock: `
      <path d="M32 60 C16 60 10 48 14 36 C16 28 22 24 22 14 C28 20 30 26 30 30 C34 22 38 12 34 2 C44 10 54 24 52 40 C50 52 44 60 32 60 Z" fill="#8f5bd6" stroke="${K}" stroke-width="2.8"/>
      <path d="M32 56 C24 56 20 48 24 40 C26 36 30 34 32 28 C36 34 42 40 40 48 C39 53 36 56 32 56 Z" fill="#b6ff6a" stroke="${K}" stroke-width="2"/>
      <circle cx="28" cy="44" r="2.6" fill="${K}"/><circle cx="36" cy="44" r="2.6" fill="${K}"/>
      <path d="M29 51 H35" stroke="${K}" stroke-width="2"/>`,
    Warrior: `
      <circle cx="24" cy="38" r="18" fill="#a8322d" stroke="${K}" stroke-width="3"/>
      <circle cx="24" cy="38" r="6" fill="#C69B6D" stroke="${K}" stroke-width="2"/>
      <path d="M38 6 H46 V44 L42 48 L38 44 Z" fill="#dfe3ea" stroke="${K}" stroke-width="2.4"/>
      <path d="M32 44 H52" stroke="${K}" stroke-width="4"/>
      <path d="M42 46 V58" stroke="#7a4e2a" stroke-width="5"/>
      <circle cx="42" cy="60" r="2.6" fill="#C69B6D" stroke="${K}" stroke-width="1.4"/>`
  };

  const MYSTERY = `
    <rect x="6" y="6" width="52" height="52" rx="10" fill="#2a2420" stroke="#f2c230" stroke-width="2.4" stroke-dasharray="4 4"/>
    <path d="M24 24 C24 14 40 14 40 24 C40 32 32 31 32 40" fill="none" stroke="#f2c230" stroke-width="5"/>
    <circle cx="32" cy="49" r="3.4" fill="#f2c230"/>`;

  const ARTS = {
    onion: `
      <rect width="64" height="64" fill="#f3e3f5"/>
      <path d="M30 14 C26 6 22 4 18 4 M33 14 C35 6 40 3 44 4 M32 14 C32 8 32 6 31 2" fill="none" stroke="#4f8a3a" stroke-width="2.6"/>
      <path d="M32 13 C46 18 54 30 52 44 C50 56 42 61 32 61 C22 61 14 56 12 44 C10 30 18 18 32 13 Z" fill="#c890d4" stroke="${K}" stroke-width="2.6"/>
      <path d="M32 15 C24 28 24 48 32 60 M32 15 C40 28 40 48 32 60" fill="none" stroke="#9a5fa8" stroke-width="1.6"/>
      <path d="M21 36 Q25 33 29 36 M35 36 Q39 33 43 36" fill="none" stroke="${K}" stroke-width="2.4"/>
      <path d="M23 39 C22 44 21 46 22 48" fill="none" stroke="#3fa9e0" stroke-width="2.6"/>
      <path d="M26 49 Q32 45 38 49" fill="none" stroke="${K}" stroke-width="2.4"/>`,
    void: `
      <rect width="64" height="64" fill="#0b0a0a"/>
      <circle cx="32" cy="32" r="20" fill="none" stroke="#2a2522" stroke-width="2" stroke-dasharray="3 5"/>
      <circle cx="32" cy="32" r="2" fill="#2a2522"/>`,
    knaga: `
      <rect width="64" height="64" fill="#ffd27a"/>
      <circle cx="9" cy="40" r="10" fill="#e8b28f" stroke="${K}" stroke-width="2.2"/>
      <circle cx="55" cy="40" r="10" fill="#e8b28f" stroke="${K}" stroke-width="2.2"/>
      <path d="M8 64 C8 40 16 26 32 26 C48 26 56 40 56 64 Z" fill="#e8b28f" stroke="${K}" stroke-width="2.6"/>
      <path d="M14 64 C14 46 20 36 26 34 L38 34 C44 36 50 46 50 64 Z" fill="#3b3b42" stroke="${K}" stroke-width="2"/>
      <path d="M23 46 Q32 50 41 46" fill="none" stroke="#24242a" stroke-width="2"/>
      <circle cx="32" cy="20" r="7" fill="#e8b28f" stroke="${K}" stroke-width="2.2"/>
      <path d="M25.5 17 C26 11 38 11 38.5 17" fill="#6b4226" stroke="${K}" stroke-width="1.4"/>
      <circle cx="29.5" cy="20" r="1" fill="${K}"/><circle cx="34.5" cy="20" r="1" fill="${K}"/>
      <path d="M30 23.5 H34" stroke="${K}" stroke-width="1.4"/>`,
    soon: `
      <rect width="64" height="64" fill="#2a2420"/>
      <rect x="14" y="22" width="36" height="24" rx="4" fill="none" stroke="#f2c230" stroke-width="2.6"/>
      <path d="M24 22 L27 17 H37 L40 22" fill="none" stroke="#f2c230" stroke-width="2.6"/>
      <circle cx="32" cy="34" r="7" fill="none" stroke="#f2c230" stroke-width="2.6"/>
      <path d="M44 14 L50 8 M48 18 L56 16" stroke="#f2c230" stroke-width="2"/>`
  };

  window.Bogowie = window.Bogowie || {};
  window.Bogowie.Icons = {
    faction: f => wrap(FACTIONS[f] || MYSTERY, f),
    race: id => wrap(RACES[id] || MYSTERY, id),
    cls: c => wrap(CLASSES[c] || MYSTERY, c),
    mystery: () => wrap(MYSTERY, '?'),
    art: (name, label) => wrap(ARTS[name] || ARTS.soon, label || name).replace('class="ico"', 'class="ico art"')
  };
})();
