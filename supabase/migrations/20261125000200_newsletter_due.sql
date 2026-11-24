-- Fällige Newsletter-Abos für die Edge Function «newsletter» (nur service_role).
-- Nur bestätigte E-Mail-Adressen; «since» = letzter Versand bzw. Abo-Beginn.
create or replace function public.newsletter_due(p_limit integer default 50)
returns table (
  id uuid, email text, name text, trip_id uuid, trip_title text, token text,
  frequency text, since timestamptz, unsubscribe_token text, delay_minutes integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, u.email::text, coalesce(nullif(p.display_name, ''), split_part(u.email::text, '@', 1)),
         s.trip_id, t.title, l.token, s.frequency, coalesce(s.last_sent_at, s.created_at),
         s.unsubscribe_token, t.location_delay_minutes
    from public.trip_subscriptions s
    join auth.users u on u.id = s.user_id and u.email_confirmed_at is not null
    join public.trips t on t.id = s.trip_id
    left join public.profiles p on p.id = s.user_id
    left join public.share_links l on l.id = s.share_link_id and l.revoked_at is null
   where s.status = 'active'
     and (s.frequency = 'instant' or coalesce(s.last_sent_at, s.created_at) <= now() - interval '7 days')
     and exists (
       select 1 from public.posts po
        where po.trip_id = s.trip_id and po.visibility = 'followers' and po.published_at is not null
          -- neu seit dem letzten Versand (auch rückdatierte Beiträge zählen über created_at)
          and (po.published_at > coalesce(s.last_sent_at, s.created_at) or po.created_at > coalesce(s.last_sent_at, s.created_at))
          and po.published_at <= now() - make_interval(mins => t.location_delay_minutes)
     )
   order by coalesce(s.last_sent_at, s.created_at)
   limit p_limit;
$$;

revoke execute on function public.newsletter_due(integer) from public, anon, authenticated;
grant execute on function public.newsletter_due(integer) to service_role;

-- Abmelden per Link aus der Mail (ohne Login)
create or replace function public.newsletter_unsubscribe(p_token text)
returns text
language sql
security definer
set search_path = ''
as $$
  update public.trip_subscriptions s set status = 'unsubscribed'
    from public.trips t
   where s.unsubscribe_token = p_token and t.id = s.trip_id
  returning t.title;
$$;

revoke execute on function public.newsletter_unsubscribe(text) from public, anon, authenticated;
grant execute on function public.newsletter_unsubscribe(text) to service_role;
