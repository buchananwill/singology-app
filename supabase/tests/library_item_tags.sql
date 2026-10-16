-- Decision 49: the join carries nothing private, so every signed-in caller sees every row and anon
-- sees none. There is no row an unrelated coach must not see; the failing case is anon and writes.
select plan(5);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.library_item_tags), 1, 'the student sees every tag link');
select throws_ok(
  $$insert into public.library_item_tags (library_item_id, tag_id)
    values ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-000000000101')$$,
  '42501',
  'new row violates row-level security policy for table "library_item_tags"',
  'nobody but the seed writes tag links'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.library_item_tags), 1, 'the coach sees every tag link');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is((select count(*)::int from public.library_item_tags), 1, 'an unrelated coach sees every tag link');
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.library_item_tags',
  '42501',
  'permission denied for table library_item_tags',
  'anon cannot read tag links'
);
reset role;

select * from finish();
