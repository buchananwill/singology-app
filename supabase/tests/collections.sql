-- Decision 49: collections.
select plan(6);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.collections where tests.ours(id)), 1, 'the student sees the active collection only');
select throws_ok(
  $$insert into public.collections (title) values ('Mine')$$,
  '42501',
  'permission denied for table collections',
  'nobody but the seed writes collections'
);
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.collections where tests.ours(id)), 1, 'the coach sees the active collection only');
reset role;

select tests.act_as(tests.id('other_coach'));
select is(
  (select count(*)::int from public.collections where id = tests.id('inactive_collection')),
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
