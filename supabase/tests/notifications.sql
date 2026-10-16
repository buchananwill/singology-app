-- Decision 55: no grants and no policies, so only the sender (adminDb) reads or writes.
select plan(6);

select tests.act_as(tests.id('student'));
select throws_ok(
  'select count(*) from public.notifications',
  '42501',
  'permission denied for table notifications',
  'the student cannot read their own notifications'
);
select throws_ok(
  $$insert into public.notifications (user_id, kind, entity_id)
    values (tests.id('student'), 'feedback_ready', tests.id('other_feedback'))$$,
  '42501',
  'permission denied for table notifications',
  'the student cannot write to the sent-log'
);
reset role;

select tests.act_as(tests.id('coach'));
select throws_ok(
  'select count(*) from public.notifications',
  '42501',
  'permission denied for table notifications',
  'the coach reads no notifications'
);
reset role;

select tests.act_as(tests.id('other_coach'));
select throws_ok(
  'select count(*) from public.notifications',
  '42501',
  'permission denied for table notifications',
  'an unrelated coach reads no notifications'
);
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.notifications',
  '42501',
  'permission denied for table notifications',
  'anon cannot read notifications'
);
reset role;

select is((select count(*)::int from public.notifications where tests.ours(user_id)), 1, 'the sent-log row is there for adminDb');

select * from finish();
