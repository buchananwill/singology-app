-- Decision 49: tag links, public to signed-in callers, so the failing cases are anon and writes.
select plan(5);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.library_item_tags where tests.ours(library_item_id)), 1, 'the student sees every tag link');
select throws_ok(
  $$insert into public.library_item_tags (library_item_id, tag_id)
    values (tests.id('inactive_library_item'), tests.id('tag'))$$,
  '42501',
  'permission denied for table library_item_tags',
  'nobody but the seed writes tag links'
);
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.library_item_tags where tests.ours(library_item_id)), 1, 'the coach sees every tag link');
reset role;

select tests.act_as(tests.id('other_coach'));
select is((select count(*)::int from public.library_item_tags where tests.ours(library_item_id)), 1, 'an unrelated coach sees every tag link');
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
