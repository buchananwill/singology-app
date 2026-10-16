-- Decisions 44 and 46.
select plan(9);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.coaches where tests.ours(user_id)), 1, 'the student sees only active coaches');
select throws_ok(
  $$insert into public.coaches (user_id, tier, avatar_src, turnaround_hours)
    values (tests.id('student'), 'standard', '/a.svg', 72)$$,
  '42501',
  'permission denied for table coaches',
  'nobody signed in makes themselves a coach'
);
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.coaches where tests.ours(user_id)), 2, 'the coach sees their own inactive row and the active coach');
update public.coaches set bio = 'Own bio' where user_id = tests.id('coach');
reset role;

select tests.act_as(tests.id('other_coach'));
select is(
  (select count(*)::int from public.coaches where user_id = tests.id('coach')),
  0,
  'an unrelated coach does not see an inactive coach'
);
select is((select count(*)::int from public.coaches where tests.ours(user_id)), 1, 'an unrelated coach sees only themselves');
update public.coaches set bio = 'Hacked' where user_id = tests.id('coach');
reset role;

select tests.act_as_anon();
select is((select count(*)::int from public.coaches where tests.ours(user_id)), 1, 'anon sees the active coach');
select is(
  (select count(*)::int from public.coaches where user_id = tests.id('coach')),
  0,
  'anon does not see an inactive coach'
);
reset role;

select is(
  (select bio from public.coaches where user_id = tests.id('coach')),
  'Own bio',
  'a coach updates their own row and an unrelated coach cannot'
);
select is(
  (select bio from public.coaches where user_id = tests.id('other_coach')),
  '',
  'the unrelated coach''s own row is untouched'
);

select * from finish();
