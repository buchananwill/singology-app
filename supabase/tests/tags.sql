-- Decision 49: tags, public to signed-in callers, so the failing cases are anon and writes.
select plan(5);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.tags where tests.ours(id)), 1, 'the student sees every tag');
select throws_ok(
  $$insert into public.tags (kind, slug, label) values ('focus', 'mine', 'Mine')$$,
  '42501',
  'permission denied for table tags',
  'nobody but the seed writes tags'
);
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.tags where tests.ours(id)), 1, 'the coach sees every tag');
reset role;

select tests.act_as(tests.id('other_coach'));
select is((select count(*)::int from public.tags where tests.ours(id)), 1, 'an unrelated coach sees every tag');
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.tags',
  '42501',
  'permission denied for table tags',
  'anon cannot read tags'
);
reset role;

select * from finish();
