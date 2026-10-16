-- Decision 54: callers append their own events and read none; adminDb reads analytics.
select plan(7);

select tests.act_as(tests.id('student'));
select throws_ok(
  'select count(*) from public.events',
  '42501',
  'permission denied for table events',
  'the student cannot read events, even their own'
);
select lives_ok(
  $$insert into public.events (user_id, kind) values (tests.id('student'), 'feedback_viewed')$$,
  'the student records their own event'
);
select throws_ok(
  $$insert into public.events (user_id, kind) values (tests.id('coach'), 'signed_in')$$,
  '42501',
  'new row violates row-level security policy for table "events"',
  'nobody records an event as someone else'
);
reset role;

select tests.act_as(tests.id('coach'));
select throws_ok(
  'select count(*) from public.events',
  '42501',
  'permission denied for table events',
  'the coach cannot read their student''s events'
);
reset role;

select tests.act_as(tests.id('other_coach'));
select throws_ok(
  'select count(*) from public.events',
  '42501',
  'permission denied for table events',
  'an unrelated coach reads no events'
);
reset role;

select tests.act_as_anon();
select throws_ok(
  $$insert into public.events (user_id, kind) values (null, 'signed_in')$$,
  '42501',
  'permission denied for table events',
  'anon cannot record events'
);
reset role;

select is((select count(*)::int from public.events where tests.ours(user_id)), 2, 'both events are stored');

select * from finish();
