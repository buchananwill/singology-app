-- Decision 50. Visible: own uploads, media of active library items, and media of submissions and
-- feedback the caller can see. S sees d1, a0, c8; C sees d1, a0, c8, c9; U sees d1, a9.
select plan(8);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.media_assets where tests.ours(id)), 3, 'the student sees the library demo, their take and their coach''s reply');
select lives_ok(
  $$insert into public.media_assets (kind, owner_user_id, store, store_key)
    values ('audio', '00000000-0000-4000-8000-0000000000a1', 'bunny_storage', 'takes/new.m4a')$$,
  'the student registers their own pending upload'
);
select throws_ok(
  $$insert into public.media_assets (kind, owner_user_id, store, store_key)
    values ('audio', '00000000-0000-4000-8000-0000000000c1', 'bunny_storage', 'takes/forged.m4a')$$,
  '42501',
  'new row violates row-level security policy for table "media_assets"',
  'nobody registers an upload owned by someone else'
);
select throws_ok(
  $$insert into public.media_assets (kind, owner_user_id, store, store_key, status, src, peaks_src, duration_sec)
    values ('audio', '00000000-0000-4000-8000-0000000000a1', 'local', '/media/x.m4a', 'ready', '/media/x.m4a', '/media/x.peaks.json', 10)$$,
  '42501',
  'new row violates row-level security policy for table "media_assets"',
  'only the media job marks an asset ready'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.media_assets where tests.ours(id)), 4, 'the coach sees the library demo, their student''s take and both their replies');
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is(
  (select count(*)::int from public.media_assets where id in (
    '00000000-0000-4000-8000-0000000000a0', '00000000-0000-4000-8000-0000000000c8',
    '00000000-0000-4000-8000-0000000000c9', '00000000-0000-4000-8000-0000000000d2')),
  0,
  'an unrelated coach sees none of the student''s or coach''s media, nor an inactive item''s'
);
select is((select count(*)::int from public.media_assets where tests.ours(id)), 2, 'an unrelated coach sees the library demo and their own student''s take');
reset role;

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.media_assets',
  '42501',
  'permission denied for table media_assets',
  'anon cannot read media'
);
reset role;

select * from finish();
