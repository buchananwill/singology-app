-- Decision 52: comments inherit through feedback_id. Comment ...601 is on C's feedback ...501 to S;
-- ...602 is on U's feedback ...502 to S2.
select plan(8);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.feedback_comments), 1, 'the student sees comments on their own feedback');
select throws_ok(
  $$insert into public.feedback_comments (feedback_id, t_seconds, body)
    values ('00000000-0000-4000-8000-000000000501', 1, 'Mine')$$,
  '42501',
  'new row violates row-level security policy for table "feedback_comments"',
  'a student cannot comment on feedback'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is(
  (select count(*)::int from public.feedback_comments where id = '00000000-0000-4000-8000-000000000601'),
  0,
  'an unrelated coach does not see the comment'
);
select is((select count(*)::int from public.feedback_comments), 1, 'an unrelated coach sees only comments on their own feedback');
select throws_ok(
  $$insert into public.feedback_comments (feedback_id, t_seconds, body)
    values ('00000000-0000-4000-8000-000000000501', 1, 'Mine')$$,
  '42501',
  'new row violates row-level security policy for table "feedback_comments"',
  'an unrelated coach cannot comment on another coach''s feedback'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.feedback_comments), 1, 'the coach sees comments on their own feedback');
select lives_ok(
  $$insert into public.feedback_comments (feedback_id, t_seconds, body)
    values ('00000000-0000-4000-8000-000000000501', 9, 'And here.')$$,
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
