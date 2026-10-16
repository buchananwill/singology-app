-- Decision 52. Feedback ...501 answers S's submission ...401 (by C); ...502 answers S2's (by U).
-- Submission ...403 (S, with C) has no feedback yet.
select plan(9);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.feedback), 1, 'the student sees feedback on their own submissions');
select throws_ok(
  $$insert into public.feedback (submission_id, coach_id)
    values ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-0000000000a1')$$,
  '42501',
  'new row violates row-level security policy for table "feedback"',
  'a student cannot write feedback'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is(
  (select count(*)::int from public.feedback where id = '00000000-0000-4000-8000-000000000501'),
  0,
  'an unrelated coach does not see the feedback'
);
select is((select count(*)::int from public.feedback), 1, 'an unrelated coach sees only their own feedback');
select throws_ok(
  $$insert into public.feedback (submission_id, coach_id)
    values ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-0000000000c2')$$,
  '42501',
  'new row violates row-level security policy for table "feedback"',
  'an unrelated coach cannot answer another coach''s student'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.feedback), 1, 'the coach sees feedback on their student''s submissions');
select throws_ok(
  $$insert into public.feedback (submission_id, coach_id)
    values ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-0000000000c2')$$,
  '42501',
  'new row violates row-level security policy for table "feedback"',
  'a coach cannot write feedback in another coach''s name'
);
select lives_ok(
  $$insert into public.feedback (submission_id, coach_id, body)
    values ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-0000000000c1', 'Good')$$,
  'the coach answers their own student'
);
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.feedback',
  '42501',
  'permission denied for table feedback',
  'anon cannot read feedback'
);
reset role;

select * from finish();
