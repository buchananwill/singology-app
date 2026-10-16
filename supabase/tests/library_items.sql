-- Decision 49: library items.
select plan(6);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.library_items where tests.ours(id)), 1, 'the student sees the active item only');
select throws_ok(
  $$insert into public.library_items (title, category, difficulty, voice_types, demo_media_id)
    values ('Mine', 'breath', 'beginner', '{mezzo}', tests.id('demo_media'))$$,
  '42501',
  'permission denied for table library_items',
  'nobody but the seed writes the library'
);
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.library_items where tests.ours(id)), 1, 'the coach sees the active item only');
reset role;

select tests.act_as(tests.id('other_coach'));
select is(
  (select count(*)::int from public.library_items where id = tests.id('inactive_library_item')),
  0,
  'an unrelated coach does not see the inactive item'
);
select is((select count(*)::int from public.library_items where tests.ours(id)), 1, 'an unrelated coach sees the active item only');
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.library_items',
  '42501',
  'permission denied for table library_items',
  'anon cannot read the library'
);
reset role;

select * from finish();
