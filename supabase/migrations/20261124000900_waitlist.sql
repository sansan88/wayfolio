-- Warteliste für öffentliche Reisen (Abo folgt später).
-- Jede:r darf sich eintragen, lesen kann nur der Service-Role-Key.
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 5 and 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  feature text not null default 'public_trips' check (feature in ('public_trips')),
  locale text check (locale is null or char_length(locale) <= 12),
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_email_feature_key on public.waitlist (lower(email), feature);

alter table public.waitlist enable row level security;

drop policy if exists "waitlist insert" on public.waitlist;
create policy "waitlist insert" on public.waitlist
  for insert to anon, authenticated
  with check (feature = 'public_trips');

revoke all on public.waitlist from anon, authenticated;
grant insert (email, feature, locale) on public.waitlist to anon, authenticated;
