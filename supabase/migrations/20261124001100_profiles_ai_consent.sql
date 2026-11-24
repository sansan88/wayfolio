-- Einwilligung für KI-Funktionen (Claude): Zeitpunkt der Zustimmung, null = aus.
alter table public.profiles add column if not exists ai_enabled_at timestamptz;

-- Profile dürfen nur in diesen Spalten selbst geändert werden (nicht z. B. is_admin).
revoke update on public.profiles from anon, authenticated;
grant update (display_name, locale, ai_enabled_at) on public.profiles to authenticated;
