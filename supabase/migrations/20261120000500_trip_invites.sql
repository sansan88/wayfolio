-- Mitreisende einladen: Einladungslink mit Token, gültig 7 Tage, einmal verwendbar.
create table public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index trip_invites_trip_idx on public.trip_invites (trip_id);
create index trip_invites_created_by_idx on public.trip_invites (created_by);
create index trip_invites_accepted_by_idx on public.trip_invites (accepted_by);

alter table public.trip_invites enable row level security;

create policy "trip_invites: Mitglieder lesen" on public.trip_invites
  for select to authenticated using (private.is_trip_member(trip_id));
create policy "trip_invites: Mitglieder erstellen" on public.trip_invites
  for insert to authenticated with check (private.is_trip_member(trip_id) and created_by = (select auth.uid()));
create policy "trip_invites: Mitglieder löschen" on public.trip_invites
  for delete to authenticated using (private.is_trip_member(trip_id));

-- Einladung annehmen. SECURITY DEFINER, weil die eingeladene Person die Reise vorher
-- nicht sehen darf. Prüft Token, Ablauf und einmalige Verwendung.
create function public.accept_trip_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.trip_invites%rowtype;
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'Nicht angemeldet';
  end if;

  select * into v_invite from public.trip_invites where token = p_token for update;
  if not found or v_invite.expires_at < now() then
    raise exception 'Diese Einladung ist ungültig oder abgelaufen.';
  end if;
  if v_invite.accepted_by is not null and v_invite.accepted_by <> v_user then
    raise exception 'Diese Einladung wurde bereits verwendet.';
  end if;

  insert into public.trip_members (trip_id, profile_id, role)
  values (v_invite.trip_id, v_user, 'coauthor')
  on conflict (trip_id, profile_id) do nothing;

  update public.trip_invites set accepted_by = v_user, accepted_at = now() where id = v_invite.id;
  return v_invite.trip_id;
end;
$$;

revoke execute on function public.accept_trip_invite(text) from public, anon;
grant execute on function public.accept_trip_invite(text) to authenticated;

-- Mitreisende sehen gegenseitig ihren Namen (für «von …» an Beiträgen und die Mitgliederliste)
create policy "profiles: Mitreisende lesen" on public.profiles
  for select to authenticated
  using (exists (
    select 1
    from public.trip_members mine
    join public.trip_members other on other.trip_id = mine.trip_id
    where mine.profile_id = (select auth.uid()) and other.profile_id = profiles.id
  ));

-- Mitreisende dürfen die Reise auch selbst verlassen
create policy "trip_members: selbst austreten" on public.trip_members
  for delete to authenticated using (profile_id = (select auth.uid()) and role <> 'owner');
