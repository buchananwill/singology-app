-- Decision 49. Item ...0b1 is active; ...0b2 is inactive and must be invisible to every caller.
select plan(6);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.library_items where tests.ours(id)), 1, 'the student sees the active item only');
select throws_ok(
  $$insert into public.library_items (title, category, difficulty, voice_types, demo_media_id)
    values ('Mine', 'breath', 'beginner', '{mezzo}', '00000000-0000-4000-8000-0000000000d1')$$,
  '42501',
  'new row violates row-level security policy for table "library_items"',
  'nobody but the seed writes the library'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.library_items where tests.ours(id)), 1, 'the coach sees the active item only');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is(
  (select count(*)::int from public.library_items where id = '00000000-0000-4000-8000-0000000000b2'),
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
