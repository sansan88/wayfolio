-- Newsletter-Abos von Community-Konten (ein Konto kann mehrere Reisen abonnieren).
-- Abonnieren nur über einen gültigen Follower-Link (RPC subscribe_trip), Bestätigung der
-- E-Mail-Adresse über den Login-Link von Supabase Auth.
create table if not exists public.trip_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  share_link_id uuid references public.share_links (id) on delete set null,
  frequency text not null default 'weekly' check (frequency in ('instant', 'weekly')),
  status text not null default 'active' check (status in ('active', 'paused', 'unsubscribed')),
  last_sent_at timestamptz,
  unsubscribe_token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, trip_id)
);

create index if not exists trip_subscriptions_trip_idx on public.trip_subscriptions (trip_id);
create index if not exists trip_subscriptions_due_idx on public.trip_subscriptions (status, frequency, last_sent_at);

create trigger trip_subscriptions_updated_at before update on public.trip_subscriptions
  for each row execute function public.set_updated_at();

alter table public.trip_subscriptions enable row level security;

-- eigene Abos lesen, Häufigkeit/Status ändern, löschen
create policy "trip_subscriptions: eigene lesen" on public.trip_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "trip_subscriptions: eigene ändern" on public.trip_subscriptions
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "trip_subscriptions: eigene löschen" on public.trip_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));
-- Reise-Mitglieder sehen und entfernen Abos ihrer Reise
create policy "trip_subscriptions: Mitglieder lesen" on public.trip_subscriptions
  for select to authenticated using (private.is_trip_member(trip_id));
create policy "trip_subscriptions: Mitglieder entfernen" on public.trip_subscriptions
  for delete to authenticated using (private.is_trip_member(trip_id));

revoke all on public.trip_subscriptions from anon, authenticated;
grant select, delete on public.trip_subscriptions to authenticated;
grant update (frequency, status) on public.trip_subscriptions to authenticated;

-- Abonnieren über den Secret Link der Reise
create or replace function public.subscribe_trip(p_token text, p_frequency text default 'weekly')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.share_links%rowtype;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Bitte zuerst anmelden.' using errcode = '28000';
  end if;
  if p_frequency not in ('instant', 'weekly') then
    raise exception 'Häufigkeit ungültig.' using errcode = '22023';
  end if;
  select * into v_link from public.share_links
   where token = p_token and role = 'follower' and revoked_at is null
     and (expires_at is null or expires_at > now());
  if not found then
    raise exception 'Der Link ist nicht mehr gültig.' using errcode = '42501';
  end if;
  insert into public.trip_subscriptions (user_id, trip_id, share_link_id, frequency, status)
  values (auth.uid(), v_link.trip_id, v_link.id, p_frequency, 'active')
  on conflict (user_id, trip_id) do update
    set frequency = excluded.frequency, status = 'active', share_link_id = excluded.share_link_id
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.subscribe_trip(text, text) from public, anon;
grant execute on function public.subscribe_trip(text, text) to authenticated;

-- Meine Abos mit Reisetitel und Link zum Lesen
create or replace function public.my_subscriptions()
returns table (id uuid, trip_id uuid, trip_title text, frequency text, status text, token text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.trip_id, t.title, s.frequency, s.status,
         case when l.revoked_at is null then l.token end, s.created_at
    from public.trip_subscriptions s
    join public.trips t on t.id = s.trip_id
    left join public.share_links l on l.id = s.share_link_id
   where s.user_id = auth.uid()
   order by s.created_at desc;
$$;

revoke execute on function public.my_subscriptions() from public, anon;
grant execute on function public.my_subscriptions() to authenticated;

-- Abonnent:innen einer Reise (nur für Mitglieder der Reise): Name, E-Mail, Häufigkeit, Status.
-- Ältere, nie bestätigte Anmeldungen aus follower_subscriptions erscheinen als «unbestätigt».
create or replace function public.trip_subscribers(p_trip_id uuid)
returns table (id uuid, name text, email text, frequency text, status text, created_at timestamptz, legacy boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_trip_member(p_trip_id) then
    raise exception 'Keine Berechtigung.' using errcode = '42501';
  end if;
  return query
    select s.id, coalesce(nullif(p.display_name, ''), split_part(u.email::text, '@', 1)), u.email::text,
           s.frequency, s.status, s.created_at, false
      from public.trip_subscriptions s
      join auth.users u on u.id = s.user_id
      left join public.profiles p on p.id = s.user_id
     where s.trip_id = p_trip_id and s.status <> 'unsubscribed'
    union all
    select fs.id, coalesce(nullif(f.display_name, ''), split_part(f.email, '@', 1)), f.email,
           fs.frequency::text, 'unconfirmed', fs.created_at, true
      from public.follower_subscriptions fs
      join public.followers f on f.id = fs.follower_id
     where fs.trip_id = p_trip_id and fs.status = 'pending' and f.email is not null
       and not exists (select 1 from public.trip_subscriptions s2 join auth.users u2 on u2.id = s2.user_id
                        where s2.trip_id = p_trip_id and lower(u2.email) = lower(f.email))
    order by 6 desc;
end;
$$;

revoke execute on function public.trip_subscribers(uuid) from public, anon;
grant execute on function public.trip_subscribers(uuid) to authenticated;

-- Reise-Mitglieder dürfen auch alte, unbestätigte Anmeldungen entfernen
create policy "follower_subscriptions: Mitglieder entfernen" on public.follower_subscriptions
  for delete to authenticated using (private.is_trip_member(trip_id));
grant delete on public.follower_subscriptions to authenticated;
