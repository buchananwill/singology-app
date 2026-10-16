-- Decision 45. Callers: student S (...0a1), their coach C (...0c1), unrelated coach U (...0c2), anon.
select plan(11);

select is(
  (select display_name from public.profiles where id = '00000000-0000-4000-8000-0000000000a1'),
  'Student',
  'handle_new_user takes the display name from the user metadata'
);
select is(
  (select display_name from public.profiles where id = '00000000-0000-4000-8000-0000000000c2'),
  'other-coach',
  'handle_new_user falls back to the email''s local part'
);

select tests.act_as('00000000-0000-4000-8000-0000000000a1');
select is((select count(*)::int from public.profiles where tests.ours(id)), 2, 'the student sees their own profile and their coach''s');
select is(
  (select count(*)::int from public.profiles where id = '00000000-0000-4000-8000-0000000000c1'),
  1,
  'the student sees their coach across the enrolment'
);
update public.profiles set display_name = 'Stu' where id = '00000000-0000-4000-8000-0000000000a1';
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c1');
select is((select count(*)::int from public.profiles where tests.ours(id)), 2, 'the coach sees their own profile and their student''s');
select is(
  (select count(*)::int from public.profiles where id = '00000000-0000-4000-8000-0000000000a1'),
  1,
  'the coach sees their student across the enrolment'
);
reset role;

select tests.act_as('00000000-0000-4000-8000-0000000000c2');
select is(
  (select count(*)::int from public.profiles
   where id in ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000c1')),
  0,
  'an unrelated coach sees neither the student nor their coach'
);
select is((select count(*)::int from public.profiles where tests.ours(id)), 2, 'an unrelated coach sees only their own side');
update public.profiles set display_name = 'Hacked' where id = '00000000-0000-4000-8000-0000000000a1';
reset role;

select is(
  (select display_name from public.profiles where id = '00000000-0000-4000-8000-0000000000a1'),
  'Stu',
  'the student updated their own profile and the unrelated coach changed nothing'
);
select is(
  (select display_name from public.profiles where id = '00000000-0000-4000-8000-0000000000c1'),
  'Coach',
  'nobody else''s profile changed'
);

select tests.act_as_anon();
select throws_ok(
  'select count(*) from public.profiles',
  '42501',
  'permission denied for table profiles',
  'anon cannot read profiles'
);
reset role;

select * from finish();
