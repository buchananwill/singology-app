-- profiles_select_active_coach reaches anon only with the table grant; RLS still limits it to the
-- profiles of active coaches.
grant select on public.profiles to anon;
