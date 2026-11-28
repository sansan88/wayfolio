-- «In der Nähe entdecken»: Links aus Beiträgen anderer Reisen als Tipps.
-- Nur Link-URL und Seitentitel des Links, Ort auf ~1 km gerundet; nie Fotos, Texte, Titel, Namen oder Reisen.
alter table public.trips
  add column if not exists share_tips boolean not null default true;

comment on column public.trips.share_tips is 'Links dieser Reise erscheinen (anonym, Ort gerundet) als Tipps «In der Nähe» bei anderen Reisenden';

create or replace function public.nearby_tips(p_lat double precision, p_lon double precision, p_radius_km double precision default 25)
returns table (url text, title text, lat double precision, lon double precision, distance_km double precision, mentions integer)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select auth.uid() as uid),
  links as (
    select b.url, nullif(trim(b.text_content), '') as title,
           -- Ort auf 2 Nachkommastellen gerundet (~1 km), Distanz nur vom gerundeten Punkt
           round(extensions.st_y(c.location::extensions.geometry)::numeric, 2)::double precision as lat,
           round(extensions.st_x(c.location::extensions.geometry)::numeric, 2)::double precision as lon
      from public.post_blocks b
      join public.posts p on p.id = b.post_id
      join public.checkins c on c.id = p.checkin_id
      join public.trips t on t.id = p.trip_id
     where (select uid from me) is not null
       and b.kind = 'link' and b.url ~* '^https?://'
       and b.url !~* '^https?://([a-z0-9-]+\.)*littlefootnotes\.app'
       and t.share_tips
       and p.visibility = 'followers'
       and p.published_at is not null
       -- frühestens 24 h nach dem Beitrag (und nach der Standort-Verzögerung der Reise): niemand wird live geortet
       and p.published_at <= now() - greatest(interval '24 hours', make_interval(mins => t.location_delay_minutes))
       -- nur andere Reisen
       and t.owner_id <> (select uid from me)
       and not exists (select 1 from public.trip_members m where m.trip_id = t.id and m.profile_id = (select uid from me))
       and extensions.st_dwithin(c.location, extensions.st_makepoint(p_lon, p_lat)::extensions.geography, least(p_radius_km, 100) * 1000 + 1000)
  ),
  scored as (
    select l.url, max(l.title) as title, min(l.lat) as lat, min(l.lon) as lon, count(*)::integer as mentions,
           extensions.st_distance(extensions.st_makepoint(min(l.lon), min(l.lat))::extensions.geography,
                                  extensions.st_makepoint(p_lon, p_lat)::extensions.geography) / 1000 as distance_km
      from links l
     group by l.url
  )
  select s.url, s.title, s.lat, s.lon, round(s.distance_km::numeric, 1)::double precision, s.mentions
    from scored s
   where s.distance_km <= least(p_radius_km, 100)
   order by s.distance_km, s.mentions desc
   limit 60;
$$;

revoke execute on function public.nearby_tips(double precision, double precision, double precision) from public, anon;
grant execute on function public.nearby_tips(double precision, double precision, double precision) to authenticated;
