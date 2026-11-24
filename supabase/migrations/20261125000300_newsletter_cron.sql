-- Newsletter-Versand alle 15 Minuten über pg_cron + pg_net.
-- Das Geheimnis für den Aufruf liegt im Vault und wird von der Edge Function über
-- newsletter_check_secret geprüft (nur service_role).
create extension if not exists pg_net;
create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'newsletter_cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'newsletter_cron_secret',
                                'Header x-newsletter-secret für die Edge Function newsletter');
  end if;
end $$;

create or replace function public.newsletter_check_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'newsletter_cron_secret' and decrypted_secret = p_secret);
$$;

revoke execute on function public.newsletter_check_secret(text) from public, anon, authenticated;
grant execute on function public.newsletter_check_secret(text) to service_role;

select cron.unschedule('newsletter') where exists (select 1 from cron.job where jobname = 'newsletter');
select cron.schedule(
  'newsletter',
  '*/15 * * * *',
  $cron$
    select net.http_post(
      url := 'https://fmafhdivuooqfixoozmi.supabase.co/functions/v1/newsletter',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-newsletter-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'newsletter_cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
  $cron$
);
