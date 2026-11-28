-- Erinnerung an die Reisenden, wenn ein paar Tage kein Beitrag mehr kam («Bist du noch da?»)
alter table public.trips
  add column if not exists reminder_days integer default 3
    check (reminder_days is null or reminder_days between 1 and 30),
  add column if not exists reminder_sent_at timestamptz;

comment on column public.trips.reminder_days is 'Erinnerung per E-Mail nach so vielen Tagen ohne Beitrag; null = aus';
comment on column public.trips.reminder_sent_at is 'Zuletzt verschickte Erinnerung (höchstens eine pro Pause)';

-- Fällige Erinnerungen: laufende Reise, mindestens ein Beitrag, seit reminder_days Tagen nichts Neues
-- und für diese Pause noch keine Erinnerung. Empfänger: Besitzer:innen der Reise mit bestätigter E-Mail.
create or replace function public.trip_reminders_due(p_limit integer default 50)
returns table (trip_id uuid, trip_title text, email text, name text, days integer, last_activity timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with activity as (
    -- auch rückdatierte Beiträge zählen: massgebend ist, wann sie erfasst wurden
    select p.trip_id, max(greatest(p.published_at, p.created_at)) as last_activity
      from public.posts p
     where p.published_at is not null
     group by p.trip_id
  ),
  due as (
    select t.id, t.title, t.reminder_days, a.last_activity
      from public.trips t
      join activity a on a.trip_id = t.id
     where t.reminder_days is not null
       and (t.starts_on is null or t.starts_on <= current_date)
       and (t.ends_on is null or t.ends_on >= current_date)
       and a.last_activity <= now() - make_interval(days => t.reminder_days)
       and (t.reminder_sent_at is null or t.reminder_sent_at < a.last_activity)
     order by a.last_activity
     limit p_limit
  ),
  owners as (
    select d.id as trip_id, t.owner_id as profile_id from due d join public.trips t on t.id = d.id
    union
    select m.trip_id, m.profile_id from public.trip_members m join due d on d.id = m.trip_id where m.role = 'owner'
  )
  select d.id, d.title, u.email::text,
         coalesce(nullif(pr.display_name, ''), split_part(u.email::text, '@', 1)),
         d.reminder_days, d.last_activity
    from due d
    join owners o on o.trip_id = d.id
    join auth.users u on u.id = o.profile_id and u.email_confirmed_at is not null
    left join public.profiles pr on pr.id = o.profile_id;
$$;

revoke execute on function public.trip_reminders_due(integer) from public, anon, authenticated;
grant execute on function public.trip_reminders_due(integer) to service_role;
