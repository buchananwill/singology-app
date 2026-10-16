-- Decision 49: the join carries nothing private, so every signed-in caller sees every row and anon
-- sees none. There is no row an unrelated coach must not see; the failing case is anon and writes.
select plan(5);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.collection_items), 2, 'the student sees every collection link');
select throws_ok(
  $$insert into public.collection_items (collection_id, library_item_id, position)
    values ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-0000000000b2', 1)$$,
  '42501',
  'new row violates row-level security policy for table "collection_items"',
  'nobody but the seed writes collection links'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.collection_items), 2, 'the coach sees every collection link');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is((select count(*)::int from public.collection_items), 2, 'an unrelated coach sees every collection link');
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.collection_items',
  '42501',
  'permission denied for table collection_items',
  'anon cannot read collection links'
);
reset role;

select * from finish();
