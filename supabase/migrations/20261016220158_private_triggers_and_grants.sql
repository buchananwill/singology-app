-- Helpers never exposed through the API (spec decisions 6 and 10), the auth.users trigger, and the
-- table grants, which mirror the RLS policy matrix exactly.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
--> statement-breakpoint

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
--> statement-breakpoint

-- Runs as its owner because the inserting role (supabase_auth_admin) cannot write public.profiles.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;
--> statement-breakpoint

revoke all on function private.touch_updated_at() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
--> statement-breakpoint

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
--> statement-breakpoint

create trigger touch_updated_at before update on public.profiles
  for each row execute function private.touch_updated_at();
--> statement-breakpoint
create trigger touch_updated_at before update on public.coaches
  for each row execute function private.touch_updated_at();
--> statement-breakpoint
create trigger touch_updated_at before update on public.coach_offers
  for each row execute function private.touch_updated_at();
--> statement-breakpoint
create trigger touch_updated_at before update on public.students
  for each row execute function private.touch_updated_at();
--> statement-breakpoint
create trigger touch_updated_at before update on public.library_items
  for each row execute function private.touch_updated_at();
--> statement-breakpoint
create trigger touch_updated_at before update on public.media_assets
  for each row execute function private.touch_updated_at();
--> statement-breakpoint
create trigger touch_updated_at before update on public.collections
  for each row execute function private.touch_updated_at();
--> statement-breakpoint
create trigger touch_updated_at before update on public.tags
  for each row execute function private.touch_updated_at();
--> statement-breakpoint

-- RLS decides which rows; these grants decide which statements, one grant per policy kind. Nothing
-- is granted on notifications, and no role but postgres deletes.
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
--> statement-breakpoint

grant select on public.coaches, public.coach_offers, public.profiles to anon;
--> statement-breakpoint

grant select on
  public.profiles, public.coaches, public.coach_offers, public.students, public.enrolments,
  public.library_items, public.collections, public.collection_items, public.tags,
  public.library_item_tags, public.media_assets, public.assignments, public.submissions,
  public.feedback, public.feedback_comments
to authenticated;
--> statement-breakpoint

grant insert on
  public.media_assets, public.submissions, public.feedback, public.feedback_comments,
  public.assignments, public.events
to authenticated;
--> statement-breakpoint

grant update on
  public.profiles, public.coaches, public.coach_offers, public.students, public.submissions
to authenticated;
