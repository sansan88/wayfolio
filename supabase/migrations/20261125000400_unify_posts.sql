-- Check-in und Beitrag sind jetzt dieselbe Art: alles wird «feed».
-- Automatisch gesetzte Titel (= Ortsname) werden entfernt; ohne Titel zeigt die App den Ort.
-- Rückblicke mit Claude haben die Art «background» (Beginn des nächsten Rückblicks).
-- Sicherung der alten Werte in backup.posts_kind_title_20261125 (Schema nicht über die API erreichbar).
create schema if not exists backup;
revoke all on schema backup from public, anon, authenticated;

create table if not exists backup.posts_kind_title_20261125 as
  select id, kind, title, now() as saved_at from public.posts;

update public.posts p
   set title = null
  from public.checkins c
 where c.id = p.checkin_id
   and p.kind in ('route_update', 'story', 'feed')
   and p.title is not null
   and (p.title = c.place_name or p.title = split_part(c.place_name, ',', 1));

update public.posts set kind = 'feed' where kind in ('route_update', 'story');
