-- Decisions 44 and 46. C (...0c1) is inactive, so only C sees C; U (...0c2) is active and public.
select plan(8);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.coaches where tests.ours(user_id)), 1, 'the student sees only active coaches');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.coaches where tests.ours(user_id)), 2, 'the coach sees their own inactive row and the active coach');
update public.coaches set bio = 'Own bio' where user_id = '00000000-0000-4000-8000-0000000000c1';
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is(
  (select count(*)::int from public.coaches where user_id = '00000000-0000-4000-8000-0000000000c1'),
  0,
  'an unrelated coach does not see an inactive coach'
);
select is((select count(*)::int from public.coaches where tests.ours(user_id)), 1, 'an unrelated coach sees only themselves');
update public.coaches set bio = 'Hacked' where user_id = '00000000-0000-4000-8000-0000000000c1';
reset role;

select tests.act_as_anon();
select is((select count(*)::int from public.coaches where tests.ours(user_id)), 1, 'anon sees the active coach');
select is(
  (select count(*)::int from public.coaches where user_id = '00000000-0000-4000-8000-0000000000c1'),
  0,
  'anon does not see an inactive coach'
);
reset role;

select is(
  (select bio from public.coaches where user_id = '00000000-0000-4000-8000-0000000000c1'),
  'Own bio',
  'a coach updates their own row and an unrelated coach cannot'
);
select is(
  (select bio from public.coaches where user_id = '00000000-0000-4000-8000-0000000000c2'),
  '',
  'the unrelated coach''s own row is untouched'
);

select * from finish();
