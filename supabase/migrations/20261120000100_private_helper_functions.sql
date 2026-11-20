-- Hilfs- und Trigger-Funktionen aus dem API-Schema "public" in ein nicht
-- exponiertes Schema "private" verschieben (Supabase-Linter 0028/0029).
-- Policies und Trigger verweisen intern per OID und funktionieren weiter.

create schema if not exists private;
grant usage on schema private to authenticated;

alter function public.is_trip_member(uuid) set schema private;
alter function public.is_trip_owner(uuid) set schema private;
alter function public.handle_new_user() set schema private;
alter function public.add_trip_owner_as_member() set schema private;

-- Niemand ruft diese Funktionen direkt auf
revoke execute on all functions in schema private from public, anon, authenticated;

-- RLS-Policies (auch auf storage.objects) laufen als "authenticated"
grant execute on function private.is_trip_member(uuid) to authenticated;
grant execute on function private.is_trip_owner(uuid) to authenticated;
