-- Decision 52: feedback comments, which inherit through feedback_id.
select plan(9);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.feedback_comments where tests.ours(feedback_id)), 1, 'the student sees comments on their own feedback');
select throws_ok(
  $$delete from public.feedback_comments where id = tests.id('comment')$$,
  '42501',
  'permission denied for table feedback_comments',
  'sent comments are immutable'
);
select throws_ok(
  $$insert into public.feedback_comments (feedback_id, t_seconds, body)
    values (tests.id('feedback'), 1, 'Mine')$$,
  '42501',
  'new row violates row-level security policy for table "feedback_comments"',
  'a student cannot comment on feedback'
);
reset role;

select tests.act_as(tests.id('other_coach'));
select is(
  (select count(*)::int from public.feedback_comments where id = tests.id('comment')),
  0,
  'an unrelated coach does not see the comment'
);
select is((select count(*)::int from public.feedback_comments where tests.ours(feedback_id)), 1, 'an unrelated coach sees only comments on their own feedback');
select throws_ok(
  $$insert into public.feedback_comments (feedback_id, t_seconds, body)
    values (tests.id('feedback'), 1, 'Mine')$$,
  '42501',
  'new row violates row-level security policy for table "feedback_comments"',
  'an unrelated coach cannot comment on another coach''s feedback'
);
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.feedback_comments where tests.ours(feedback_id)), 1, 'the coach sees comments on their own feedback');
select lives_ok(
  $$insert into public.feedback_comments (feedback_id, t_seconds, body)
    values (tests.id('feedback'), 9, 'And here.')$$,
  'the coach comments on their own feedback'
);
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.feedback_comments',
  '42501',
  'permission denied for table feedback_comments',
  'anon cannot read comments'
);
reset role;

select * from finish();
