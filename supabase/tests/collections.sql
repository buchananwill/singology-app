-- Decision 49. Collection ...201 is active; ...202 is inactive and must be invisible to every caller.
select plan(5);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.collections where tests.ours(id)), 1, 'the student sees the active collection only');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.collections where tests.ours(id)), 1, 'the coach sees the active collection only');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is(
  (select count(*)::int from public.collections where id = '00000000-0000-4000-8000-000000000202'),
  0,
  'an unrelated coach does not see the inactive collection'
);
select is((select count(*)::int from public.collections where tests.ours(id)), 1, 'an unrelated coach sees the active collection only');
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.collections',
  '42501',
  'permission denied for table collections',
  'anon cannot read collections'
);
reset role;

select * from finish();
