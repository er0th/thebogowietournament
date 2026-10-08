-- TheBogowieTournament — baza w Supabase.
-- Wklej całość w Supabase → SQL Editor → Run. Można uruchomić ponownie (jest idempotentne).
-- Zasady pilnowane tutaj, po stronie serwera:
--   * turniej może zacząć tylko zalogowany użytkownik (Discord),
--   * jeden wpis na użytkownika na dzień,
--   * dzień: od startu eventu do dziś (czas polski), nigdy w przyszłość, najpóźniej deadline,
--   * całe losowanie robi serwer, więc odświeżanie strony nic nie zmienia,
--   * wpisów nie da się edytować ani usuwać — poza adminem.

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

-- ---------- turnieje ----------
create table if not exists public.tournaments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  user_name    text not null,
  avatar_url   text,
  faction      text not null check (faction in ('Horde', 'Alliance')),
  t_date       date not null,
  result       jsonb not null,
  winner_race  text not null,
  winner_class text not null,
  created_at   timestamptz not null default now(),
  unique (user_id, t_date)
);
create index if not exists tournaments_date_idx on public.tournaments (t_date);
alter table public.tournaments enable row level security;
drop policy if exists "results are public" on public.tournaments;
create policy "results are public" on public.tournaments for select using (true);
-- Brak polityk insert/update/delete: zapisuje wyłącznie funkcja start_tournament.

-- ---------- admini ----------
create table if not exists public.admins (user_id uuid primary key references auth.users (id) on delete cascade);
alter table public.admins enable row level security;
-- Brak polityk: tabelę zmieniasz tylko z panelu Supabase.

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

create or replace function public.start_tournament(p_faction text, p_date date)
returns public.tournaments
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_today  date := (now() at time zone 'Europe/Warsaw')::date;
  v_meta   jsonb;
  v_name   text;
  v_avatar text;
  v_races  text[];
  v_cls    text[];
  v_race   text;
  v_round  jsonb;
  v_s1     jsonb := '[]'::jsonb;
  v_s2     jsonb := '[]'::jsonb;
  v_counts int[] := array[0, 0, 0];
  v_seq    int[] := '{}';
  v_pick   int;
  v_target int := public.final_target();
  v_row    public.tournaments;
begin
  if v_uid is null then raise exception 'Musisz być zalogowany.'; end if;
  if p_faction is null or p_faction not in ('Horde', 'Alliance') then raise exception 'Wybierz Hordę albo Przymierze.'; end if;
  if p_date is null then raise exception 'Wybierz datę.'; end if;
  if p_date > v_today then raise exception 'Nie da się grać w przyszłości. Jeszcze.'; end if;
  if p_date < public.event_start() or p_date > public.event_end() then raise exception 'Ta data jest poza eventem.'; end if;
  if exists (select 1 from public.tournaments where user_id = v_uid and t_date = p_date) then
    raise exception 'Masz już wpis na ten dzień.';
  end if;

  select raw_user_meta_data into v_meta from auth.users where id = v_uid;
  v_name := left(coalesce(v_meta -> 'custom_claims' ->> 'global_name', v_meta ->> 'full_name', v_meta ->> 'name', 'Anonim'), 64);
  v_avatar := v_meta ->> 'avatar_url';

  -- Etap 1: trzy razy rasa z całej frakcji.
  select array_agg(distinct race_id) into v_races from public.combos where faction = p_faction;
  for i in 1..3 loop
    v_s1 := v_s1 || jsonb_build_array(public._draw_round(v_races));
  end loop;

  -- Etap 2: dla każdej wylosowanej rasy — jej klasy.
  for i in 0..2 loop
    v_race := v_s1 -> i ->> 'winner';
    select array_agg(class) into v_cls from public.combos where faction = p_faction and race_id = v_race;
    v_round := public._draw_round(v_cls) || jsonb_build_object('race', v_race);
    v_s2 := v_s2 || jsonb_build_array(v_round);
  end loop;

  -- Finał: losujemy Combo 1/2/3, aż któreś trafi v_target razy.
  loop
    select x into v_pick from generate_series(0, 2) as g(x) order by gen_random_uuid() limit 1;
    v_seq := v_seq || v_pick;
    v_counts[v_pick + 1] := v_counts[v_pick + 1] + 1;
    exit when v_counts[v_pick + 1] >= v_target;
  end loop;

  insert into public.tournaments (user_id, user_name, avatar_url, faction, t_date, result, winner_race, winner_class)
  values (
    v_uid, v_name, v_avatar, p_faction, p_date,
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
  when unique_violation then raise exception 'Masz już wpis na ten dzień.';
end $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

create or replace function public.admin_delete_tournament(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Tylko admin może usuwać wpisy.'; end if;
  delete from public.tournaments where id = p_id;
end $$;

-- ---------- uprawnienia ----------
revoke all on function public._draw_round(text[]) from public, anon, authenticated;
revoke all on function public.start_tournament(text, date) from public, anon;
grant execute on function public.start_tournament(text, date) to authenticated;
revoke all on function public.admin_delete_tournament(uuid) from public, anon;
grant execute on function public.admin_delete_tournament(uuid) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- jak dodać admina ----------
-- 1. Zaloguj się raz na stronie przez Discord.
-- 2. Supabase → Authentication → Users → skopiuj swoje User UID.
-- 3. Uruchom:  insert into public.admins (user_id) values ('TU-WKLEJ-UID');
