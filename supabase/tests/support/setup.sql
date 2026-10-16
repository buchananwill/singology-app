-- Shared RLS test cast, run as postgres inside each test file's transaction (which is rolled back).
-- Ids are fixed so test files can name rows literally; the last group reads as follows:
--   ...0a1 student S, ...0c1 their coach C (inactive, so not publicly listed),
--   ...0c2 unrelated coach U (active), ...0a2 U's student S2
--   ...0f1 C's offer (inactive), ...0f2 U's offer; ...0e1 enrolment S-C, ...0e2 enrolment S2-U
--   ...0d1 demo media of the active item, ...0d2 demo media of the inactive item,
--   ...0b1 active library item, ...0b2 inactive library item
--   ...101 tag; ...201 active collection, ...202 inactive collection
--   ...0a0 S's take, ...0a9 S2's take, ...0c8 C's attached reply, ...0c9 C's unattached pending reply
--   ...301 assignment on S-C, ...302 assignment on S2-U
--   ...401 S's submission (reviewed by C), ...402 S2's submission, ...403 S's unreviewed submission
--   ...501 feedback on 401, ...502 feedback on 402; ...601 comment on 501, ...602 comment on 502
--   ...701 notification for S

create extension if not exists pgtap with schema extensions;

create schema tests;
grant usage on schema tests to anon, authenticated;

-- Every row this setup creates has an id with this prefix, which the seed's version-5 ids never
-- have, so counts scoped by tests.ours() hold on an empty and on a seeded database alike.
create function tests.ours(id uuid) returns boolean language sql immutable as $$
  select id::text like '00000000-0000-4000-8000-%'
$$;

create function tests.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create function tests.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end;
$$;

insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'student@rls.test', '{"display_name":"Student"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000c1', 'coach@rls.test', '{"display_name":"Coach"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000c2', 'other-coach@rls.test', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000a2', 'other-student@rls.test', '{}', 'authenticated', 'authenticated');

insert into public.coaches (user_id, tier, avatar_src, turnaround_hours, active) values
  ('00000000-0000-4000-8000-0000000000c1', 'premium', '/avatars/c.svg', 72, false),
  ('00000000-0000-4000-8000-0000000000c2', 'standard', '/avatars/u.svg', 72, true);

insert into public.students (user_id, voice_type) values
  ('00000000-0000-4000-8000-0000000000a1', 'mezzo'),
  ('00000000-0000-4000-8000-0000000000a2', 'bass');

insert into public.coach_offers (id, coach_id, tier, name, billing, price_pence, submissions_per_period, active) values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000c1', 'premium', 'Monthly', 'monthly', 8000, 4, false),
  ('00000000-0000-4000-8000-0000000000f2', '00000000-0000-4000-8000-0000000000c2', 'standard', 'Monthly', 'monthly', 4500, 4, true);

insert into public.enrolments (id, student_id, coach_id, offer_id) values
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000f1'),
  ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000f2');

insert into public.media_assets (id, kind, owner_user_id, store, store_key, status, src, peaks_src, duration_sec) values
  ('00000000-0000-4000-8000-0000000000d1', 'audio', null, 'local', '/media/d1.m4a', 'ready', '/media/d1.m4a', '/media/d1.peaks.json', 30),
  ('00000000-0000-4000-8000-0000000000d2', 'audio', null, 'local', '/media/d2.m4a', 'ready', '/media/d2.m4a', '/media/d2.peaks.json', 30),
  ('00000000-0000-4000-8000-0000000000a0', 'audio', '00000000-0000-4000-8000-0000000000a1', 'local', '/media/a0.m4a', 'ready', '/media/a0.m4a', '/media/a0.peaks.json', 30),
  ('00000000-0000-4000-8000-0000000000a9', 'audio', '00000000-0000-4000-8000-0000000000a2', 'local', '/media/a9.m4a', 'ready', '/media/a9.m4a', '/media/a9.peaks.json', 30),
  ('00000000-0000-4000-8000-0000000000c8', 'audio', '00000000-0000-4000-8000-0000000000c1', 'local', '/media/c8.m4a', 'ready', '/media/c8.m4a', '/media/c8.peaks.json', 30),
  ('00000000-0000-4000-8000-0000000000c9', 'audio', '00000000-0000-4000-8000-0000000000c1', 'local', '/media/c9.m4a', 'pending', null, null, null);

insert into public.library_items (id, title, category, difficulty, voice_types, demo_media_id, active) values
  ('00000000-0000-4000-8000-0000000000b1', 'Active item', 'breath', 'beginner', '{mezzo,bass}', '00000000-0000-4000-8000-0000000000d1', true),
  ('00000000-0000-4000-8000-0000000000b2', 'Inactive item', 'range', 'advanced', '{mezzo}', '00000000-0000-4000-8000-0000000000d2', false);

insert into public.tags (id, kind, slug, label) values
  ('00000000-0000-4000-8000-000000000101', 'focus', 'rlstest-legato', 'RLS test legato');

insert into public.library_item_tags (library_item_id, tag_id) values
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-000000000101');

insert into public.collections (id, title, position, active) values
  ('00000000-0000-4000-8000-000000000201', 'Active collection', 0, true),
  ('00000000-0000-4000-8000-000000000202', 'Inactive collection', 1, false);

insert into public.collection_items (collection_id, library_item_id, position) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-0000000000b1', 0),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-0000000000b2', 0);

insert into public.assignments (id, enrolment_id, library_item_id) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000b1'),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000b1');

insert into public.submissions (id, enrolment_id, assignment_id, library_item_id, media_id, status) values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a0', 'reviewed'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a9', 'reviewed'),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-0000000000e1', null, '00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a0', 'awaiting_review');

insert into public.feedback (id, submission_id, coach_id, body, reply_media_id) values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-0000000000c1', 'Good.', '00000000-0000-4000-8000-0000000000c8'),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-0000000000c2', 'Fine.', null);

insert into public.feedback_comments (id, feedback_id, t_seconds, body) values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000501', 3, 'Nice start.'),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000502', 5, 'Steady.');

insert into public.events (user_id, kind) values
  ('00000000-0000-4000-8000-0000000000a1', 'signed_in');

insert into public.notifications (id, user_id, kind, entity_id) values
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-0000000000a1', 'feedback_ready', '00000000-0000-4000-8000-000000000501');
