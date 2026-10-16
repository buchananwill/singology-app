-- The shared RLS test cast, run as postgres inside each test file's rolled-back transaction.

create extension if not exists pgtap with schema extensions;

create schema tests;
grant usage on schema tests to anon, authenticated;

create function tests.id(name text) returns uuid language plpgsql immutable as $$
declare
  found uuid;
begin
  found := case name
    when 'student' then '00000000-0000-4000-8000-0000000000a1'
    when 'other_student' then '00000000-0000-4000-8000-0000000000a2'
    when 'coach' then '00000000-0000-4000-8000-0000000000c1'
    when 'other_coach' then '00000000-0000-4000-8000-0000000000c2'
    when 'offer' then '00000000-0000-4000-8000-0000000000f1'
    when 'other_offer' then '00000000-0000-4000-8000-0000000000f2'
    when 'enrolment' then '00000000-0000-4000-8000-0000000000e1'
    when 'other_enrolment' then '00000000-0000-4000-8000-0000000000e2'
    when 'demo_media' then '00000000-0000-4000-8000-0000000000d1'
    when 'inactive_demo_media' then '00000000-0000-4000-8000-0000000000d2'
    when 'student_take' then '00000000-0000-4000-8000-0000000000b0'
    when 'other_student_take' then '00000000-0000-4000-8000-0000000000b9'
    when 'coach_reply' then '00000000-0000-4000-8000-0000000000c8'
    when 'coach_pending_reply' then '00000000-0000-4000-8000-0000000000c9'
    when 'library_item' then '00000000-0000-4000-8000-0000000000b1'
    when 'inactive_library_item' then '00000000-0000-4000-8000-0000000000b2'
    when 'tag' then '00000000-0000-4000-8000-000000000101'
    when 'collection' then '00000000-0000-4000-8000-000000000201'
    when 'inactive_collection' then '00000000-0000-4000-8000-000000000202'
    when 'assignment' then '00000000-0000-4000-8000-000000000301'
    when 'other_assignment' then '00000000-0000-4000-8000-000000000302'
    when 'submission_reviewed' then '00000000-0000-4000-8000-000000000401'
    when 'other_submission' then '00000000-0000-4000-8000-000000000402'
    when 'submission_awaiting' then '00000000-0000-4000-8000-000000000403'
    when 'feedback' then '00000000-0000-4000-8000-000000000501'
    when 'other_feedback' then '00000000-0000-4000-8000-000000000502'
    when 'comment' then '00000000-0000-4000-8000-000000000601'
    when 'other_comment' then '00000000-0000-4000-8000-000000000602'
    when 'notification' then '00000000-0000-4000-8000-000000000701'
  end;
  if found is null then
    raise exception 'unknown test id %', name;
  end if;
  return found;
end;
$$;

-- Every id above has this prefix and the seed's version-5 ids never do, so counts scoped by
-- tests.ours() hold on an empty and on a seeded database alike.
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
  (tests.id('student'), 'student@rls.test', '{"display_name":"Student"}', 'authenticated', 'authenticated'),
  (tests.id('coach'), 'coach@rls.test', '{"display_name":"Coach"}', 'authenticated', 'authenticated'),
  (tests.id('other_coach'), 'other-coach@rls.test', '{}', 'authenticated', 'authenticated'),
  (tests.id('other_student'), 'other-student@rls.test', '{}', 'authenticated', 'authenticated');

-- The coach is inactive, so not publicly listed; the other coach is active.
insert into public.coaches (user_id, tier, avatar_src, turnaround_hours, active) values
  (tests.id('coach'), 'premium', '/avatars/c.svg', 72, false),
  (tests.id('other_coach'), 'standard', '/avatars/u.svg', 72, true);

insert into public.students (user_id, voice_type) values
  (tests.id('student'), 'mezzo'),
  (tests.id('other_student'), 'bass');

insert into public.coach_offers (id, coach_id, tier, name, billing, price_pence, submissions_per_period, active) values
  (tests.id('offer'), tests.id('coach'), 'premium', 'Monthly', 'monthly', 8000, 4, false),
  (tests.id('other_offer'), tests.id('other_coach'), 'standard', 'Monthly', 'monthly', 4500, 4, true);

insert into public.enrolments (id, student_id, coach_id, offer_id) values
  (tests.id('enrolment'), tests.id('student'), tests.id('coach'), tests.id('offer')),
  (tests.id('other_enrolment'), tests.id('other_student'), tests.id('other_coach'), tests.id('other_offer'));

insert into public.media_assets (id, kind, owner_user_id, store, store_key, status, src, peaks_src, duration_sec) values
  (tests.id('demo_media'), 'audio', null, 'local', '/media/d1.m4a', 'ready', '/media/d1.m4a', '/media/d1.peaks.json', 30),
  (tests.id('inactive_demo_media'), 'audio', null, 'local', '/media/d2.m4a', 'ready', '/media/d2.m4a', '/media/d2.peaks.json', 30),
  (tests.id('student_take'), 'audio', tests.id('student'), 'local', '/media/b0.m4a', 'ready', '/media/b0.m4a', '/media/b0.peaks.json', 30),
  (tests.id('other_student_take'), 'audio', tests.id('other_student'), 'local', '/media/b9.m4a', 'ready', '/media/b9.m4a', '/media/b9.peaks.json', 30),
  (tests.id('coach_reply'), 'audio', tests.id('coach'), 'local', '/media/c8.m4a', 'ready', '/media/c8.m4a', '/media/c8.peaks.json', 30),
  (tests.id('coach_pending_reply'), 'audio', tests.id('coach'), 'local', '/media/c9.m4a', 'pending', null, null, null);

insert into public.library_items (id, title, category, difficulty, voice_types, demo_media_id, active) values
  (tests.id('library_item'), 'Active item', 'breath', 'beginner', '{mezzo,bass}', tests.id('demo_media'), true),
  (tests.id('inactive_library_item'), 'Inactive item', 'range', 'advanced', '{mezzo}', tests.id('inactive_demo_media'), false);

insert into public.tags (id, kind, slug, label) values
  (tests.id('tag'), 'focus', 'rlstest-legato', 'RLS test legato');

insert into public.library_item_tags (library_item_id, tag_id) values
  (tests.id('library_item'), tests.id('tag'));

insert into public.collections (id, title, position, active) values
  (tests.id('collection'), 'Active collection', 0, true),
  (tests.id('inactive_collection'), 'Inactive collection', 1, false);

insert into public.collection_items (collection_id, library_item_id, position) values
  (tests.id('collection'), tests.id('library_item'), 0),
  (tests.id('inactive_collection'), tests.id('inactive_library_item'), 0);

insert into public.assignments (id, enrolment_id, library_item_id) values
  (tests.id('assignment'), tests.id('enrolment'), tests.id('library_item')),
  (tests.id('other_assignment'), tests.id('other_enrolment'), tests.id('library_item'));

insert into public.submissions (id, enrolment_id, assignment_id, library_item_id, media_id, status) values
  (tests.id('submission_reviewed'), tests.id('enrolment'), tests.id('assignment'), tests.id('library_item'), tests.id('student_take'), 'reviewed'),
  (tests.id('other_submission'), tests.id('other_enrolment'), tests.id('other_assignment'), tests.id('library_item'), tests.id('other_student_take'), 'reviewed'),
  (tests.id('submission_awaiting'), tests.id('enrolment'), null, tests.id('library_item'), tests.id('student_take'), 'awaiting_review');

insert into public.feedback (id, submission_id, coach_id, body, reply_media_id) values
  (tests.id('feedback'), tests.id('submission_reviewed'), tests.id('coach'), 'Good.', tests.id('coach_reply')),
  (tests.id('other_feedback'), tests.id('other_submission'), tests.id('other_coach'), 'Fine.', null);

insert into public.feedback_comments (id, feedback_id, t_seconds, body) values
  (tests.id('comment'), tests.id('feedback'), 3, 'Nice start.'),
  (tests.id('other_comment'), tests.id('other_feedback'), 5, 'Steady.');

insert into public.events (user_id, kind) values
  (tests.id('student'), 'signed_in');

insert into public.notifications (id, user_id, kind, entity_id) values
  (tests.id('notification'), tests.id('student'), 'feedback_ready', tests.id('feedback'));
