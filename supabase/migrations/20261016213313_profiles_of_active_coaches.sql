CREATE POLICY "profiles_select_active_coach" ON "profiles" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
        select 1 from public.coaches c where c.user_id = profiles.id and c.active
      ));