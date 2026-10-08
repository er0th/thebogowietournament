# TheBogowieTournament

Turniej gildii **Bogowie Forever** w WoW: Forever. Los wybiera rasę, klasę i zwycięzcę.

- **Randomizer** — dla każdego, bez logowania i bez zapisu.
- **Turniej**: gracz wybiera lub wpisuje nick (zapamiętany na urządzeniu), jeden wpis na nick dziennie, wpis nie do usunięcia (poza adminem).
- **Kalendarz** i **Gracze** (top 3 combo) — widoczne dla wszystkich.

Bez konfiguracji Supabase strona działa w **trybie demo**: wpisy turniejowe zapisują się tylko w przeglądarce.

## Zasady turnieju

1. **Etap 1 · Rasy:** 5 ras frakcji → 3 → 1. Trzy razy: Rasa A, B, C (mogą się powtarzać).
2. **Etap 2 · Klasy:** dla każdej rasy do 5 jej klas → 3 → 1. Wychodzą Combo 1, 2, 3.
3. **Finał · Bo7:** losujemy spośród 3 combo, aż któreś trafi 4 razy.

Całe losowanie w turnieju robi serwer (`supabase/schema.sql`), więc odświeżanie strony nic nie zmienia.

## Uruchomienie (ok. 15 minut)

### 1. GitHub Pages
Repo → **Settings → Pages** → Source: *Deploy from a branch*, gałąź `main`, folder `/ (root)`.
Strona będzie pod `https://<login>.github.io/<repo>/`.

### 2. Supabase
1. Załóż darmowe konto na supabase.com i nowy projekt (region np. Frankfurt).
2. **SQL Editor** → wklej całe `supabase/schema.sql` → **Run**.
3. **Project Settings → API**: skopiuj *Project URL* i klucz *anon public* do `config.js`.

### 3. Usuwanie wpisu (admin)
Supabase → **Table Editor** → `entries` → zaznacz wiersz → **Delete**.

## Zdjęcia i dźwięki
- Zdjęcia wrzuć do folderu `img/` i wpisz w `config.js`: `PHOTOS` (polaroidy w nagłówku) i `PLAYERS` (zdjęcie przy nicku).
- Dźwięki wrzuć do `sfx/` (najlepiej .mp3, bo Safari nie gra .ogg) i wpisz w `config.js` → `SFX`. Opis kluczy (rasa, klasa, combo, gracz, finał, meczbol, start) jest w komentarzu nad `SFX`. Bez pliku gra syntezator.

## Zmiana dat lub liczby trafień w finale
Zmień w **obu** miejscach: `config.js` (`EVENT_START`, `EVENT_END`, `FINAL_TARGET`) i w `supabase/schema.sql` (`event_start`, `event_end`, `final_target`), potem uruchom SQL ponownie.

---
Fanowski projekt, niepowiązany z Blizzard Entertainment. Ikony narysowane od zera.
