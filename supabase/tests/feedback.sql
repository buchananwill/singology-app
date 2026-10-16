-- Decision 52: feedback.
select plan(10);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.feedback where tests.ours(submission_id)), 1, 'the student sees feedback on their own submissions');
select throws_ok(
  $$update public.feedback set body = 'Changed' where id = tests.id('feedback')$$,
  '42501',
  'permission denied for table feedback',
  'sent feedback is immutable'
);
select throws_ok(
  $$insert into public.feedback (submission_id, coach_id)
    values (tests.id('submission_awaiting'), tests.id('student'))$$,
  '42501',
  'new row violates row-level security policy for table "feedback"',
  'a student cannot write feedback'
);
reset role;

select tests.act_as(tests.id('other_coach'));
select is(
  (select count(*)::int from public.feedback where id = tests.id('feedback')),
  0,
  'an unrelated coach does not see the feedback'
);
select is((select count(*)::int from public.feedback where tests.ours(submission_id)), 1, 'an unrelated coach sees only their own feedback');
select throws_ok(
  $$insert into public.feedback (submission_id, coach_id)
    values (tests.id('submission_awaiting'), tests.id('other_coach'))$$,
  '42501',
  'new row violates row-level security policy for table "feedback"',
  'an unrelated coach cannot answer another coach''s student'
);
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.feedback where tests.ours(submission_id)), 1, 'the coach sees feedback on their student''s submissions');
select throws_ok(
  $$insert into public.feedback (submission_id, coach_id)
    values (tests.id('submission_awaiting'), tests.id('other_coach'))$$,
  '42501',
  'new row violates row-level security policy for table "feedback"',
  'a coach cannot write feedback in another coach''s name'
);
select lives_ok(
  $$insert into public.feedback (submission_id, coach_id, body)
    values (tests.id('submission_awaiting'), tests.id('coach'), 'Good')$$,
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
