-- Decision 49: tags carry nothing private, so every signed-in caller sees every row and anon sees
-- none. There is no row an unrelated coach must not see; the failing case is anon and writes.
select plan(5);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.tags where tests.ours(id)), 1, 'the student sees every tag');
select throws_ok(
  $$insert into public.tags (kind, slug, label) values ('focus', 'mine', 'Mine')$$,
  '42501',
  'new row violates row-level security policy for table "tags"',
  'nobody but the seed writes tags'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.tags where tests.ours(id)), 1, 'the coach sees every tag');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
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
