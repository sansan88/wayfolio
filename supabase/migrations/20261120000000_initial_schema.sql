-- Wayfolio – initiales Schema (Phase 0)
-- Reisende haben ein Konto (Supabase Auth). Follower haben KEIN Konto: Sie greifen
-- ausschliesslich über Edge Functions zu, die den Secret Link prüfen und mit der
-- Service-Rolle schreiben. Deshalb gibt es hier keine Policies für die Rolle "anon".

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Aufzählungen
-- ---------------------------------------------------------------------------
create type public.plan_kind as enum ('free', 'plus', 'trip_pass');
create type public.post_kind as enum ('story', 'feed', 'background', 'route_update', 'poll');
create type public.block_kind as enum ('text', 'photo', 'video', 'audio', 'link', 'background_ref', 'poll_ref');
create type public.post_visibility as enum ('followers', 'group', 'private');
create type public.share_role as enum ('follower', 'gallery');
create type public.poll_status as enum ('open', 'closed', 'resolved');
create type public.delivery_channel as enum ('email', 'whatsapp');
create type public.delivery_frequency as enum ('instant', 'weekly', 'monthly');
create type public.delivery_status as enum ('pending', 'active', 'paused', 'unsubscribed');
create type public.reply_visibility as enum ('public', 'private');
create type public.media_kind as enum ('photo', 'video', 'audio');

-- ---------------------------------------------------------------------------
-- Hilfsfunktion: updated_at pflegen
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Konten und Abos
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'de',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Profil automatisch beim Registrieren anlegen
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bezahl-Abo aus Stripe; wird nur vom Stripe-Webhook (Service-Rolle) geschrieben
create table public.plan_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  plan public.plan_kind not null default 'free',
  status text not null default 'active',
  trip_id uuid, -- nur beim Reise-Pass; FK unten, nach public.trips
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plan_subscriptions_profile_idx on public.plan_subscriptions (profile_id);
create trigger plan_subscriptions_updated_at before update on public.plan_subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reisen und Mitglieder
-- ---------------------------------------------------------------------------
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  cover_media_id uuid, -- FK unten, nach public.media
  starts_on date,
  ends_on date,
  route_line extensions.geography (LineString, 4326), -- vereinfachte Linie für das Routenbild
  location_delay_minutes integer not null default 0 check (location_delay_minutes >= 0),
  route_images_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trips_owner_idx on public.trips (owner_id);
create trigger trips_updated_at before update on public.trips
  for each row execute function public.set_updated_at();

alter table public.plan_subscriptions
  add constraint plan_subscriptions_trip_fk foreign key (trip_id) references public.trips (id) on delete set null;

create table public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'coauthor' check (role in ('owner', 'coauthor')),
  created_at timestamptz not null default now(),
  primary key (trip_id, profile_id)
);

create index trip_members_profile_idx on public.trip_members (profile_id);

-- Owner automatisch als Mitglied eintragen
create function public.add_trip_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.trip_members (trip_id, profile_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger trips_add_owner after insert on public.trips
  for each row execute function public.add_trip_owner_as_member();

-- Rechte-Helfer (security definer, damit RLS auf trip_members nicht rekursiv wird)
create function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip_id and m.profile_id = (select auth.uid())
  );
$$;

create function public.is_trip_owner(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trips t
    where t.id = p_trip_id and t.owner_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Check-ins, Medien, Beiträge
-- ---------------------------------------------------------------------------
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  location extensions.geography (Point, 4326) not null,
  place_name text,
  country_code text check (country_code is null or char_length(country_code) = 2),
  recorded_at timestamptz not null default now(),
  publish_at timestamptz, -- Standort-Verzögerung
  route_image_path text,
  leg_distance_m integer,
  created_at timestamptz not null default now()
);

create index checkins_trip_time_idx on public.checkins (trip_id, recorded_at desc);
create index checkins_location_idx on public.checkins using gist (location);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id),
  kind public.media_kind not null,
  storage_path text not null unique, -- Pfad im Bucket "media": <trip_id>/<datei>
  variants jsonb not null default '{}'::jsonb,
  taken_at timestamptz,
  taken_location extensions.geography (Point, 4326),
  transcript text,
  duration_seconds numeric,
  created_at timestamptz not null default now()
);

create index media_trip_idx on public.media (trip_id, taken_at);

alter table public.trips
  add constraint trips_cover_media_fk foreign key (cover_media_id) references public.media (id) on delete set null;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  kind public.post_kind not null,
  title text,
  checkin_id uuid references public.checkins (id) on delete set null,
  visibility public.post_visibility not null default 'followers',
  share_group text, -- nur bei visibility = 'group'
  replies_enabled boolean not null default true,
  replies_public boolean not null default true,
  published_at timestamptz, -- null = Entwurf
  story_expires_at timestamptz, -- Ende der 24-Stunden-Anzeige im Story-Kreis
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (visibility <> 'group' or share_group is not null)
);

create index posts_trip_published_idx on public.posts (trip_id, published_at desc);
create index posts_trip_kind_idx on public.posts (trip_id, kind);
create trigger posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

create table public.post_blocks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  position integer not null,
  kind public.block_kind not null,
  text_content text,
  media_id uuid references public.media (id) on delete set null,
  url text,
  ref_post_id uuid references public.posts (id) on delete set null, -- Hintergrund oder Abstimmung
  created_at timestamptz not null default now(),
  unique (post_id, position)
);

-- ---------------------------------------------------------------------------
-- Abstimmungen
-- ---------------------------------------------------------------------------
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts (id) on delete cascade,
  question text not null,
  description text,
  closes_at timestamptz,
  status public.poll_status not null default 'open',
  chosen_option_id uuid, -- «Unsere Entscheidung»; FK unten
  decision_text text,
  decision_media_id uuid references public.media (id) on delete set null,
  resolved_at timestamptz
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  position integer not null,
  label text not null,
  media_id uuid references public.media (id) on delete set null,
  unique (poll_id, position)
);

alter table public.polls
  add constraint polls_chosen_option_fk foreign key (chosen_option_id) references public.poll_options (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Secret Links und Follower (ohne Konto)
-- ---------------------------------------------------------------------------
create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  role public.share_role not null default 'follower',
  group_name text,
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'), -- 192 Bit
  show_live_location boolean not null default false,
  pin_hash text, -- optionale PIN für Galerie-Links
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index share_links_trip_idx on public.share_links (trip_id);

create table public.followers (
  id uuid primary key default gen_random_uuid(),
  share_link_id uuid not null references public.share_links (id) on delete cascade,
  display_name text not null,
  device_token_hash text not null unique,
  email text,
  phone text,
  blocked_at timestamptz,
  created_at timestamptz not null default now()
);

create index followers_link_idx on public.followers (share_link_id);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  follower_id uuid not null references public.followers (id) on delete cascade,
  emoji text not null check (emoji in ('❤️', '😍', '😂', '😮', '🙏', '🎉')),
  created_at timestamptz not null default now(),
  unique (post_id, follower_id, emoji)
);

create index reactions_post_idx on public.reactions (post_id);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  follower_id uuid references public.followers (id) on delete cascade,
  author_profile_id uuid references public.profiles (id) on delete cascade,
  parent_reply_id uuid references public.replies (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  visibility public.reply_visibility not null default 'public',
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  -- genau ein Absender: Follower ODER reisende Person
  check ((follower_id is null) <> (author_profile_id is null)),
  -- flach: nur Reisende dürfen auf eine Antwort antworten
  check (parent_reply_id is null or author_profile_id is not null)
);

create index replies_post_idx on public.replies (post_id, created_at);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  follower_id uuid not null references public.followers (id) on delete cascade,
  comment text check (comment is null or char_length(comment) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (poll_id, follower_id)
);

create index votes_poll_idx on public.votes (poll_id);
create trigger votes_updated_at before update on public.votes
  for each row execute function public.set_updated_at();

-- Newsletter-Abo eines Followers (nicht verwechseln mit plan_subscriptions)
create table public.follower_subscriptions (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.followers (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  channel public.delivery_channel not null default 'email',
  frequency public.delivery_frequency not null default 'weekly',
  status public.delivery_status not null default 'pending', -- pending bis Double-Opt-in
  confirmed_at timestamptz,
  paused_until timestamptz,
  last_sent_at timestamptz,
  unsubscribe_token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  unique (follower_id, trip_id, channel)
);

create index follower_subscriptions_due_idx on public.follower_subscriptions (status, frequency, last_sent_at);

-- ---------------------------------------------------------------------------
-- Row-Level-Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.plan_subscriptions enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.checkins enable row level security;
alter table public.media enable row level security;
alter table public.posts enable row level security;
alter table public.post_blocks enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.share_links enable row level security;
alter table public.followers enable row level security;
alter table public.reactions enable row level security;
alter table public.replies enable row level security;
alter table public.votes enable row level security;
alter table public.follower_subscriptions enable row level security;

-- Profile: nur das eigene
create policy "profiles: eigenes lesen" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: eigenes ändern" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Abos: nur lesen, geschrieben wird vom Stripe-Webhook
create policy "plan_subscriptions: eigene lesen" on public.plan_subscriptions
  for select to authenticated using (profile_id = (select auth.uid()));

-- Reisen
create policy "trips: Mitglieder lesen" on public.trips
  for select to authenticated using (public.is_trip_member(id));
create policy "trips: selbst anlegen" on public.trips
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "trips: Mitglieder ändern" on public.trips
  for update to authenticated using (public.is_trip_member(id)) with check (public.is_trip_member(id));
create policy "trips: Owner löscht" on public.trips
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Mitglieder
create policy "trip_members: Mitglieder lesen" on public.trip_members
  for select to authenticated using (public.is_trip_member(trip_id));
create policy "trip_members: Owner verwaltet (insert)" on public.trip_members
  for insert to authenticated with check (public.is_trip_owner(trip_id));
create policy "trip_members: Owner verwaltet (delete)" on public.trip_members
  for delete to authenticated using (public.is_trip_owner(trip_id) and role <> 'owner');

-- Tabellen mit trip_id: alles für Mitglieder der Reise
create policy "checkins: Mitglieder" on public.checkins
  for all to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
create policy "media: Mitglieder" on public.media
  for all to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
create policy "posts: Mitglieder" on public.posts
  for all to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
create policy "share_links: Mitglieder" on public.share_links
  for all to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
create policy "follower_subscriptions: Mitglieder lesen" on public.follower_subscriptions
  for select to authenticated using (public.is_trip_member(trip_id));

-- Tabellen, die über einen Beitrag an der Reise hängen
create policy "post_blocks: Mitglieder" on public.post_blocks
  for all to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and public.is_trip_member(p.trip_id)))
  with check (exists (select 1 from public.posts p where p.id = post_id and public.is_trip_member(p.trip_id)));

create policy "polls: Mitglieder" on public.polls
  for all to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and public.is_trip_member(p.trip_id)))
  with check (exists (select 1 from public.posts p where p.id = post_id and public.is_trip_member(p.trip_id)));

create policy "poll_options: Mitglieder" on public.poll_options
  for all to authenticated
  using (exists (
    select 1 from public.polls pl join public.posts p on p.id = pl.post_id
    where pl.id = poll_id and public.is_trip_member(p.trip_id)))
  with check (exists (
    select 1 from public.polls pl join public.posts p on p.id = pl.post_id
    where pl.id = poll_id and public.is_trip_member(p.trip_id)));

-- Follower-Daten: Reisende lesen und moderieren; Follower schreiben über Edge Functions
create policy "followers: Mitglieder lesen" on public.followers
  for select to authenticated
  using (exists (select 1 from public.share_links l where l.id = share_link_id and public.is_trip_member(l.trip_id)));
create policy "followers: Mitglieder sperren" on public.followers
  for update to authenticated
  using (exists (select 1 from public.share_links l where l.id = share_link_id and public.is_trip_member(l.trip_id)))
  with check (exists (select 1 from public.share_links l where l.id = share_link_id and public.is_trip_member(l.trip_id)));

create policy "reactions: Mitglieder lesen" on public.reactions
  for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and public.is_trip_member(p.trip_id)));

create policy "votes: Mitglieder lesen" on public.votes
  for select to authenticated
  using (exists (
    select 1 from public.polls pl join public.posts p on p.id = pl.post_id
    where pl.id = poll_id and public.is_trip_member(p.trip_id)));

create policy "replies: Mitglieder lesen" on public.replies
  for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and public.is_trip_member(p.trip_id)));
create policy "replies: Reisende antworten" on public.replies
  for insert to authenticated
  with check (
    author_profile_id = (select auth.uid())
    and follower_id is null
    and exists (select 1 from public.posts p where p.id = post_id and public.is_trip_member(p.trip_id)));
create policy "replies: Mitglieder moderieren" on public.replies
  for update to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and public.is_trip_member(p.trip_id)))
  with check (exists (select 1 from public.posts p where p.id = post_id and public.is_trip_member(p.trip_id)));

-- ---------------------------------------------------------------------------
-- Storage: privater Bucket für Medien, Pfad beginnt mit der trip_id
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

create policy "media bucket: Mitglieder lesen" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "media bucket: Mitglieder hochladen" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
create policy "media bucket: Mitglieder löschen" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_trip_member(((storage.foldername(name))[1])::uuid));
