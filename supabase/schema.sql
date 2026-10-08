-- TheBogowieTournament — baza w Supabase.
-- Wklej całość w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie.
-- Bez logowania: gracz podaje nick. Zasady pilnowane tutaj, po stronie serwera:
--   * jeden wpis na nick na dzień (wielkość liter bez znaczenia),
--   * dzień: od startu eventu do dziś (czas polski), nigdy w przyszłość, najpóźniej deadline,
--   * całe losowanie robi serwer, więc odświeżanie strony nic nie zmienia,
--   * wpisów nie da się edytować ani usuwać ze strony. Usuwa admin w Table Editor.

-- Sprzątanie po pierwszej wersji (logowanie Discordem). Bezpieczne, jeśli ich nie ma.
drop function if exists public.start_tournament(text, date);
drop function if exists public.admin_delete_tournament(uuid);
drop function if exists public.is_admin();
drop table if exists public.admins;
drop table if exists public.tournaments;

-- ---------- ustawienia eventu ----------
create or replace function public.event_start()  returns date language sql immutable as $$ select date '2026-10-08' $$;
create or replace function public.event_end()    returns date language sql immutable as $$ select date '2026-11-03' $$;
create or replace function public.final_target() returns int  language sql immutable as $$ select 4 $$;  -- Bo7

-- ---------- roster WoW: Forever ----------
create table if not exists public.combos (
  faction text not null check (faction in ('Horde', 'Alliance')),
  race_id text not null,
  class   text not null,
  primary key (faction, race_id, class)
);
alter table public.combos enable row level security;
drop policy if exists "combos are public" on public.combos;
create policy "combos are public" on public.combos for select using (true);

insert into public.combos (faction, race_id, class) values
  ('Horde','orc','Hunter'),('Horde','orc','Mage'),('Horde','orc','Rogue'),('Horde','orc','Shaman'),('Horde','orc','Warlock'),('Horde','orc','Warrior'),
  ('Horde','undead','Mage'),('Horde','undead','Paladin'),('Horde','undead','Priest'),('Horde','undead','Rogue'),('Horde','undead','Warlock'),('Horde','undead','Warrior'),
  ('Horde','tauren','Druid'),('Horde','tauren','Hunter'),('Horde','tauren','Shaman'),('Horde','tauren','Warrior'),
  ('Horde','troll','Hunter'),('Horde','troll','Mage'),('Horde','troll','Priest'),('Horde','troll','Rogue'),('Horde','troll','Shaman'),('Horde','troll','Warlock'),('Horde','troll','Warrior'),
  ('Horde','windshaper','Druid'),('Horde','windshaper','Hunter'),('Horde','windshaper','Rogue'),('Horde','windshaper','Shaman'),('Horde','windshaper','Warrior'),
  ('Alliance','human','Hunter'),('Alliance','human','Mage'),('Alliance','human','Paladin'),('Alliance','human','Priest'),('Alliance','human','Rogue'),('Alliance','human','Warlock'),('Alliance','human','Warrior'),
  ('Alliance','dwarf','Hunter'),('Alliance','dwarf','Paladin'),('Alliance','dwarf','Priest'),('Alliance','dwarf','Rogue'),('Alliance','dwarf','Shaman'),('Alliance','dwarf','Warrior'),
  ('Alliance','nightelf','Druid'),('Alliance','nightelf','Hunter'),('Alliance','nightelf','Priest'),('Alliance','nightelf','Rogue'),('Alliance','nightelf','Warrior'),
  ('Alliance','gnome','Mage'),('Alliance','gnome','Priest'),('Alliance','gnome','Rogue'),('Alliance','gnome','Warlock'),('Alliance','gnome','Warrior'),
  ('Alliance','highorder','Druid'),('Alliance','highorder','Hunter'),('Alliance','highorder','Mage'),('Alliance','highorder','Rogue'),('Alliance','highorder','Warrior')
on conflict do nothing;

-- ---------- wpisy ----------
create table if not exists public.entries (
  id           uuid primary key default gen_random_uuid(),
  nick         text not null check (char_length(nick) between 2 and 24 and nick !~ '[[:cntrl:]<>"`]'),
  faction      text not null check (faction in ('Horde', 'Alliance')),
  t_date       date not null,
  result       jsonb not null,
  winner_race  text not null,
  winner_class text not null,
  created_at   timestamptz not null default now()
);
create unique index if not exists entries_nick_day on public.entries (lower(nick), t_date);
create index if not exists entries_date_idx on public.entries (t_date);
alter table public.entries enable row level security;
drop policy if exists "results are public" on public.entries;
create policy "results are public" on public.entries for select using (true);
-- Brak polityk insert/update/delete: zapisuje wyłącznie funkcja start_tournament.

-- ---------- losowanie ----------
-- Jedno losowanie: do 5 kandydatów → 3 przechodzą → 1 wygrywa.
-- Kolejność wg gen_random_uuid() (kryptograficzna losowość) daje równomierne tasowanie.
create or replace function public._draw_round(pool text[])
returns jsonb language plpgsql volatile set search_path = public as $$
declare
  c   text[];
  adv text[];
  w   text;
begin
  select array_agg(x order by gen_random_uuid()) into c from unnest(pool) as t(x);
  c := c[1:least(5, array_length(c, 1))];
  select array_agg(x order by gen_random_uuid()) into adv from unnest(c) as t(x);
  adv := adv[1:3];
  select x into w from unnest(adv) as t(x) order by gen_random_uuid() limit 1;
  return jsonb_build_object('contenders', to_jsonb(c), 'advancing', to_jsonb(adv), 'winner', w);
end $$;

create or replace function public.start_tournament(p_nick text, p_faction text, p_date date)
returns public.entries
language plpgsql volatile security definer set search_path = public as $$
declare
  v_nick   text := btrim(regexp_replace(coalesce(p_nick, ''), '\s+', ' ', 'g'));
  v_today  date := (now() at time zone 'Europe/Warsaw')::date;
  v_races  text[];
  v_cls    text[];
  v_race   text;
  v_s1     jsonb := '[]'::jsonb;
  v_s2     jsonb := '[]'::jsonb;
  v_counts int[] := array[0, 0, 0];
  v_seq    int[] := '{}';
  v_pick   int;
  v_target int := public.final_target();
  v_row    public.entries;
begin
  if char_length(v_nick) < 2 or char_length(v_nick) > 24 then raise exception 'Nick ma mieć od 2 do 24 znaków.'; end if;
  if v_nick ~ '[[:cntrl:]<>"`]' then raise exception 'W nicku tylko litery, cyfry, spacja, _ - .'; end if;
  if p_faction is null or p_faction not in ('Horde', 'Alliance') then raise exception 'Wybierz Hordę albo Przymierze.'; end if;
  if p_date is null then raise exception 'Wybierz dzień.'; end if;
  if p_date > v_today then raise exception 'W przyszłość się nie gra, cwaniaku.'; end if;
  if p_date < public.event_start() or p_date > public.event_end() then raise exception 'Ten dzień jest poza eventem.'; end if;
  if exists (select 1 from public.entries where lower(nick) = lower(v_nick) and t_date = p_date) then
    raise exception '% ma już wpis na ten dzień.', v_nick;
  end if;
  -- Ten sam nick zawsze w tej samej pisowni, w jakiej padł pierwszy raz.
  v_nick := coalesce((select nick from public.entries where lower(nick) = lower(v_nick) order by created_at limit 1), v_nick);

  select array_agg(distinct race_id) into v_races from public.combos where faction = p_faction;
  for i in 1..3 loop
    v_s1 := v_s1 || jsonb_build_array(public._draw_round(v_races));
  end loop;

  for i in 0..2 loop
    v_race := v_s1 -> i ->> 'winner';
    select array_agg(class) into v_cls from public.combos where faction = p_faction and race_id = v_race;
    v_s2 := v_s2 || jsonb_build_array(public._draw_round(v_cls) || jsonb_build_object('race', v_race));
  end loop;

  loop
    select x into v_pick from generate_series(0, 2) as g(x) order by gen_random_uuid() limit 1;
    v_seq := v_seq || v_pick;
    v_counts[v_pick + 1] := v_counts[v_pick + 1] + 1;
    exit when v_counts[v_pick + 1] >= v_target;
  end loop;

  insert into public.entries (nick, faction, t_date, result, winner_race, winner_class)
  values (
    v_nick, p_faction, p_date,
    jsonb_build_object(
      'faction', p_faction, 'stage1', v_s1, 'stage2', v_s2,
      'final', jsonb_build_object('sequence', to_jsonb(v_seq), 'target', v_target, 'winnerSlot', v_pick)
    ),
    v_s2 -> v_pick ->> 'race',
    v_s2 -> v_pick ->> 'winner'
  )
  returning * into v_row;
  return v_row;
exception
  when unique_violation then raise exception '% ma już wpis na ten dzień.', v_nick;
end $$;

-- ---------- uprawnienia ----------
revoke all on function public._draw_round(text[]) from public, anon, authenticated;
grant execute on function public.start_tournament(text, text, date) to anon, authenticated;

-- ---------- usuwanie wpisu (admin) ----------
-- Supabase → Table Editor → entries → zaznacz wiersz → Delete.
