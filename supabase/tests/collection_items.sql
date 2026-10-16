-- Decision 49: collection links, public to signed-in callers, so the failing cases are anon and writes.
select plan(5);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.collection_items where tests.ours(collection_id)), 2, 'the student sees every collection link');
select throws_ok(
  $$insert into public.collection_items (collection_id, library_item_id, position)
    values (tests.id('collection'), tests.id('inactive_library_item'), 1)$$,
  '42501',
  'permission denied for table collection_items',
  'nobody but the seed writes collection links'
);
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.collection_items where tests.ours(collection_id)), 2, 'the coach sees every collection link');
reset role;

select tests.act_as(tests.id('other_coach'));
select is((select count(*)::int from public.collection_items where tests.ours(collection_id)), 2, 'an unrelated coach sees every collection link');
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
