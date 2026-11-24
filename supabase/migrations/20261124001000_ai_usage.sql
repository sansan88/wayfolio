-- Protokoll für KI-Entwürfe (Beiträge mit Claude): nur zur Begrenzung pro Person und Tag.
-- Kein Zugriff aus dem Browser; nur die Edge Function «ai-draft» schreibt mit der Service-Rolle.
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_created_idx on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
