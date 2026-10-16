-- Decision 54: callers append their own events and read none; analytics are read by adminDb only.
-- The setup holds one event by S.
select plan(7);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.events where tests.ours(user_id)), 0, 'the student cannot read events, even their own');
select lives_ok(
  $$insert into public.events (user_id, kind) values ('00000000-0000-4000-8000-0000000000a1', 'feedback_viewed')$$,
  'the student records their own event'
);
select throws_ok(
  $$insert into public.events (user_id, kind) values ('00000000-0000-4000-8000-0000000000c1', 'signed_in')$$,
  '42501',
  'new row violates row-level security policy for table "events"',
  'nobody records an event as someone else'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.events where tests.ours(user_id)), 0, 'the coach cannot read their student''s events');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is((select count(*)::int from public.events where tests.ours(user_id)), 0, 'an unrelated coach reads no events');
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.events',
  '42501',
  'permission denied for table events',
  'anon cannot read events'
);
reset role;

select is((select count(*)::int from public.events where tests.ours(user_id)), 2, 'both events are stored');

select * from finish();
