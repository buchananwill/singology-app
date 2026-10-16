-- Decision 55: no policies, so only the sender (adminDb) reads or writes. The setup holds one
-- notification for S.
select plan(6);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.notifications where tests.ours(user_id)), 0, 'the student cannot read their own notifications');
select throws_ok(
  $$insert into public.notifications (user_id, kind, entity_id)
    values ('00000000-0000-4000-8000-0000000000a1', 'feedback_ready', '00000000-0000-4000-8000-000000000502')$$,
  '42501',
  'new row violates row-level security policy for table "notifications"',
  'the student cannot write to the sent-log'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.notifications where tests.ours(user_id)), 0, 'the coach reads no notifications');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is((select count(*)::int from public.notifications where tests.ours(user_id)), 0, 'an unrelated coach reads no notifications');
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
