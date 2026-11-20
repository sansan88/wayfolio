-- Routenpunkte einer Reise als Länge/Breite (für Karte und Routenbild).
-- SECURITY INVOKER: es gelten die RLS-Regeln der aufrufenden Person.
create function public.trip_checkins(p_trip_id uuid)
returns table (id uuid, lon double precision, lat double precision, place_name text, recorded_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.id,
         extensions.st_x(c.location::extensions.geometry),
         extensions.st_y(c.location::extensions.geometry),
         c.place_name,
         c.recorded_at
  from public.checkins c
  where c.trip_id = p_trip_id
  order by c.recorded_at;
$$;

revoke execute on function public.trip_checkins(uuid) from public, anon;
grant execute on function public.trip_checkins(uuid) to authenticated, service_role;
