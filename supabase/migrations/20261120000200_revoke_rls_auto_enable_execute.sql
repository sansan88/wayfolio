-- public.rls_auto_enable() ist die Event-Trigger-Funktion von Supabase, die bei neuen
-- Tabellen automatisch RLS einschaltet (Projekt-Option). Event-Trigger brauchen kein
-- EXECUTE-Recht der Aufrufer; über die API soll sie niemand aufrufen können.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
