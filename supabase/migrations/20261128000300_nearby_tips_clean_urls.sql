-- Tipps: Teilen-/Tracking-Parameter aus Links entfernen (z. B. Airbnb unique_share_id, Instagram igsh/dmpr,
-- Google g_st), damit kein Tipp verrät, wer ihn geteilt hat. Gleiche Links werden danach zusammengefasst.
create or replace function private.clean_share_url(p_url text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(regexp_replace(regexp_replace(
           regexp_replace(p_url,
             '([?&])(unique_share_id|viralityEntryPoint|s|igsh|igshid|dmpr|g_st|si|fbclid|gclid|mibextid|ref|ref_src|share_id|shh|lucs|entry|utm_[a-z_]+)=[^&#]*',
             '\1', 'gi'),
           '&{2,}', '&', 'g'),
         '\?&', '?', 'g'),
       '[?&]+(#|$)', '\1', 'g');
$$;

create or replace function public.nearby_tips(p_lat double precision, p_lon double precision, p_radius_km double precision default 25)
returns table (url text, title text, lat double precision, lon double precision, distance_km double precision, mentions integer)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select auth.uid() as uid),
  links as (
    select private.clean_share_url(b.url) as url, nullif(trim(b.text_content), '') as title,
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
