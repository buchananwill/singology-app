-- Decision 50.
select plan(9);

select tests.act_as(tests.id('student'));
select is((select count(*)::int from public.media_assets where tests.ours(id)), 3, 'the student sees the library demo, their take and their coach''s reply');
select lives_ok(
  $$insert into public.media_assets (kind, owner_user_id, store, store_key)
    values ('audio', tests.id('student'), 'bunny_storage', 'takes/new.m4a')$$,
  'the student registers their own pending upload'
);
select throws_ok(
  $$insert into public.media_assets (kind, owner_user_id, store, store_key)
    values ('audio', tests.id('coach'), 'bunny_storage', 'takes/forged.m4a')$$,
  '42501',
  'new row violates row-level security policy for table "media_assets"',
  'nobody registers an upload owned by someone else'
);
select throws_ok(
  $$insert into public.media_assets (kind, owner_user_id, store, store_key, status, src, peaks_src, duration_sec)
    values ('audio', tests.id('student'), 'local', '/media/x.m4a', 'ready', '/media/x.m4a', '/media/x.peaks.json', 10)$$,
  '42501',
  'new row violates row-level security policy for table "media_assets"',
  'only the media job marks an asset ready'
);
select throws_ok(
  $$update public.media_assets set status = 'ready' where id = tests.id('student_take')$$,
  '42501',
  'permission denied for table media_assets',
  'nobody signed in updates an asset; its status is the job''s'
);
reset role;

select tests.act_as(tests.id('coach'));
select is((select count(*)::int from public.media_assets where tests.ours(id)), 4, 'the coach sees the library demo, their student''s take and both their replies');
reset role;

select tests.act_as(tests.id('other_coach'));
select is(
  (select count(*)::int from public.media_assets where id in (
    tests.id('student_take'), tests.id('coach_reply'),
    tests.id('coach_pending_reply'), tests.id('inactive_demo_media'))),
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
